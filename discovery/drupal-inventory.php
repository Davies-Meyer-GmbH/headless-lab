<?php

/**
 * @file
 * Drupal inventory for the discovery stage.
 *
 * Read-only: loads configuration and counts entities, never creates,
 * updates, or deletes anything. Prints one JSON document to stdout.
 *
 * Run:
 *   vendor/bin/drush --uri=https://headless-lab.local php:script \
 *     discovery/drupal-inventory.php > discovery/out/drupal.json
 *
 * Menus for the admin UI (admin, account, tools, and Navigation module menus)
 * are skipped and listed under menus_skipped.
 */

use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas\Entity\Page;
use Drupal\canvas\Entity\PageVariant;
use Drupal\Core\Entity\FieldableEntityInterface;
use Drupal\Core\Field\FieldConfigInterface;
use Drupal\Core\Menu\MenuTreeParameters;
use Drupal\media\Entity\MediaType;
use Drupal\node\Entity\NodeType;
use Drupal\system\Entity\Menu;
use Drupal\taxonomy\Entity\Vocabulary;

$report = [
  'source' => 'live-drupal',
  'generated' => gmdate('c'),
  'errors' => [],
  'conventions' => [
    'jsonapi_fields' => 'JSON:API exposes snake_case field names as lowerCamelCase; a node title arrives as label, not title.',
  ],
];

function alpina_jsonapi_name(string $machine): string {
  return lcfirst(str_replace('_', '', ucwords($machine, '_')));
}

function alpina_count(string $entity_type, array $conditions = []): ?int {
  try {
    $query = \Drupal::entityTypeManager()->getStorage($entity_type)->getQuery()
      ->accessCheck(FALSE);
    foreach ($conditions as $field => $value) {
      $query->condition($field, $value);
    }
    return (int) $query->count()->execute();
  }
  catch (\Throwable $e) {
    return NULL;
  }
}

// Content types with fields and node counts.
try {
  $report['content_types'] = [];
  foreach (NodeType::loadMultiple() as $type) {
    $bundle = $type->id();
    $fields = [];
    foreach (\Drupal::service('entity_field.manager')
      ->getFieldDefinitions('node', $bundle) as $name => $definition) {
      if (!$definition instanceof FieldConfigInterface) {
        continue;
      }
      $storage = $definition->getFieldStorageDefinition();
      $fields[] = [
        'machine' => $name,
        'jsonapi' => alpina_jsonapi_name($name),
        'label' => $definition->getLabel(),
        'type' => $storage->getType(),
        'cardinality' => $storage->getCardinality(),
        'required' => $definition->isRequired(),
      ];
    }
    $report['content_types'][] = [
      'machine' => $bundle,
      'label' => $type->label(),
      'description' => (string) $type->getDescription(),
      'nodes_total' => alpina_count('node', ['type' => $bundle]),
      'nodes_published' => alpina_count('node', ['type' => $bundle, 'status' => 1]),
      'fields' => $fields,
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'content_types: ' . $e->getMessage();
}

// Vocabularies with term counts.
try {
  $report['vocabularies'] = [];
  foreach (Vocabulary::loadMultiple() as $vocabulary) {
    $report['vocabularies'][] = [
      'machine' => $vocabulary->id(),
      'label' => $vocabulary->label(),
      'terms' => alpina_count('taxonomy_term', ['vid' => $vocabulary->id()]),
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'vocabularies: ' . $e->getMessage();
}

// Menus with their link trees.
try {
  $report['menus'] = [];
  $report['menus_skipped'] = [];
  $tree_service = \Drupal::menuTree();
  // Menus for the admin UI never reach the frontend. Core's own, plus any
  // menu provided by the Navigation module. Site menus and custom menus stay.
  $admin_menus = ['admin', 'account', 'tools'];
  foreach (Menu::loadMultiple() as $menu) {
    if (in_array($menu->id(), $admin_menus, TRUE) || in_array('navigation', $menu->getDependencies()['module'] ?? [], TRUE)) {
      $report['menus_skipped'][] = $menu->id();
      continue;
    }
    $links = [];
    $walk = function (array $elements, int $depth) use (&$walk, &$links) {
      foreach ($elements as $element) {
        /** @var \Drupal\Core\Menu\MenuLinkInterface $link */
        $link = $element->link;
        try {
          $url = $link->getUrlObject()->toUriString();
        }
        catch (\Throwable $e) {
          $url = '';
        }
        $links[] = [
          'title' => (string) $link->getTitle(),
          'url' => $url,
          'depth' => $depth,
          'enabled' => $link->isEnabled(),
        ];
        if (!empty($element->subtree)) {
          $walk($element->subtree, $depth + 1);
        }
      }
    };
    $walk($tree_service->load($menu->id(), new MenuTreeParameters()), 0);
    $report['menus'][] = [
      'machine' => $menu->id(),
      'label' => $menu->label(),
      'links' => $links,
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'menus: ' . $e->getMessage();
}

// Media types with item counts.
try {
  $report['media_types'] = [];
  foreach (MediaType::loadMultiple() as $media_type) {
    $report['media_types'][] = [
      'machine' => $media_type->id(),
      'label' => $media_type->label(),
      'items' => alpina_count('media', ['bundle' => $media_type->id()]),
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'media_types: ' . $e->getMessage();
}

// Canvas JS components with props, slots, and entity bindings.
try {
  $report['canvas_components'] = [];
  foreach (JavaScriptComponent::loadMultiple() as $component) {
    $props = [];
    foreach ($component->getProps() ?? [] as $name => $definition) {
      $props[] = [
        'name' => $name,
        'title' => $definition['title'] ?? $name,
        'type' => $definition['type'] ?? 'string',
        'ref' => $definition['$ref'] ?? '',
        'required' => in_array($name, $component->getRequiredProps(), TRUE),
      ];
    }
    $slots = [];
    foreach ($component->get('slots') ?? [] as $name => $definition) {
      $slots[] = [
        'name' => $name,
        'title' => is_array($definition) ? ($definition['title'] ?? $name) : $name,
      ];
    }
    $entity_fields = [];
    foreach ($component->getContentEntityReferenceProps() as $prop_name => $definition) {
      try {
        $entity_fields[$prop_name] = $component->getEntityFieldExpressions($prop_name);
      }
      catch (\Throwable $e) {
        $entity_fields[$prop_name] = [];
      }
    }
    $report['canvas_components'][] = [
      'machine' => $component->id(),
      'label' => $component->label(),
      'status' => $component->status(),
      'props' => $props,
      'slots' => $slots,
      'entity_fields' => $entity_fields,
      // Versions live on the Component entity (js.<machine>), not on the
      // JavaScriptComponent definition.
      'version' => ($versioned = Component::load('js.' . $component->id()))
        ? $versioned->getActiveVersion() : '',
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'canvas_components: ' . $e->getMessage();
}

// Page variants and Canvas pages with their component trees.
try {
  $report['page_variants'] = [];
  foreach (PageVariant::loadMultiple() as $variant) {
    $report['page_variants'][] = [
      'machine' => $variant->id(),
      'label' => $variant->label(),
      'components' => alpina_component_ids($variant->toArray()),
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'page_variants: ' . $e->getMessage();
}

try {
  $report['canvas_pages'] = [];
  foreach (Page::loadMultiple() as $page) {
    $path = '';
    if ($page->hasField('path') && !$page->get('path')->isEmpty()) {
      $path = (string) $page->get('path')->value;
    }
    $ordered = [];
    if ($page->hasField('components')) {
      foreach ($page->get('components')->getValue() as $item) {
        if (!empty($item['component_id'])) {
          $ordered[] = $item['component_id'];
        }
      }
    }
    $report['canvas_pages'][] = [
      'id' => (int) $page->id(),
      'title' => $page->label(),
      'path' => $path,
      'components' => $ordered,
    ];
  }
}
catch (\Throwable $e) {
  $report['errors'][] = 'canvas_pages: ' . $e->getMessage();
}

function alpina_component_ids(array $data): array {
  $found = [];
  $scan = function ($value) use (&$scan, &$found) {
    if (is_array($value)) {
      foreach ($value as $key => $item) {
        if ($key === 'component_id' && is_string($item)) {
          $found[] = $item;
        }
        else {
          $scan($item);
        }
      }
    }
  };
  $scan($data);
  return array_values(array_unique($found));
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
