<?php
/**
 * Adds the Alpina store-logo section to the homepage and the footer to the
 * Alpina page variant. Run from the project root:
 * vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-store-logo-footer.php
 * Re-runs skip existing media, menu links, and placements.
 */
use Drupal\canvas\AutoSave\AutoSaveManager;
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas\Entity\Page;
use Drupal\canvas\Entity\PageVariant;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Symfony\Component\Yaml\Yaml;

$root = dirname(DRUPAL_ROOT);
$created = [];

// Register the new and changed definitions, keeping the frontend's other components.
$names = ['alpina_shell', 'alpina_store_logo', 'alpina_footer'];
$definitions = [];
foreach (\Drupal::config('canvas_headless.settings')->get('frontends') as $frontend) {
  if ($frontend['url'] !== 'http://localhost:3000') continue;
  foreach ($frontend['components'] as $id) {
    if (in_array(substr($id, 3), $names, TRUE)) continue;
    $js = JavaScriptComponent::load(substr($id, 3));
    if ($js) $definitions[] = ['machineName' => $js->id(), 'name' => $js->label(), 'status' => $js->status(), 'props' => $js->get('props') ?: [], 'required' => $js->get('required') ?: [], 'slots' => $js->get('slots') ?: []];
  }
}
$meta = [];
foreach ($names as $name) {
  $meta[$name] = Yaml::parseFile("$root/frontend/components/$name/component.yml");
  $definition = $meta[$name];
  $definition['props'] = $definition['props']['properties'];
  $definitions[] = $definition;
}
$result = \Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'), ['version' => 1, 'components' => $definitions]);
if ($result['errors']) throw new RuntimeException(implode("\n", $result['errors']));
echo 'Components: ' . json_encode(array_intersect_key($result, array_flip(['created', 'updated', 'unchanged', 'warnings']))) . "\n";

function alpinaItem(string $id, array $inputs, ?string $parent = NULL, ?string $slot = NULL): array {
  return ['uuid' => \Drupal::service('uuid')->generate(), 'parent_uuid' => $parent, 'slot' => $slot, 'component_id' => $id, 'component_version' => Component::load($id)->getActiveVersion(), 'inputs' => $inputs];
}

// Store logos. Core image media does not accept SVG, so Hubo uses a PNG export.
$directory = 'public://alpina';
\Drupal::service('file_system')->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
$logo_ids = [];
foreach (['Hubo' => "$root/frontend/public/alpina/img/_icn/logos-hubo-cms.png", 'Colos' => "$root/alpina-be-frontend/img/_icn/logos-colos.png"] as $label => $source) {
  $name = "Alpina store logo $label";
  $media_storage = \Drupal::entityTypeManager()->getStorage('media');
  $existing = $media_storage->loadByProperties(['bundle' => 'image', 'name' => $name]);
  $media = reset($existing);
  if (!$media) {
    $uri = "$directory/store-logo-" . strtolower($label) . '.png';
    $files = \Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri' => $uri]);
    $file = reset($files);
    if (!$file) {
      $file = \Drupal::service('file.repository')->writeData(file_get_contents($source), $uri, FileExists::Error);
      $file->setPermanent(); $file->save();
    }
    $media = $media_storage->create(['bundle' => 'image', 'name' => $name, 'status' => 1, 'uid' => 1, 'field_media_image' => ['target_id' => $file->id(), 'alt' => $label]]);
    $media->save();
    $created[] = 'media ' . $media->id() . ": $name";
  }
  $logo_ids[$label] = $media->id();
}

// Footer menu links. Destinations are placeholders until the pages exist.
foreach (['Kontakt', 'Legal', 'TNB', 'Privacy'] as $weight => $title) {
  $existing = \Drupal::entityTypeManager()->getStorage('menu_link_content')->loadByProperties(['menu_name' => 'footer', 'title' => $title]);
  if ($existing) continue;
  MenuLinkContent::create(['menu_name' => 'footer', 'title' => $title, 'link' => ['uri' => 'route:<nolink>'], 'weight' => $weight, 'expanded' => FALSE])->save();
  $created[] = "footer menu link: $title";
}

// Footer in the Alpina page variant, so every page using it shows the footer.
$variant = PageVariant::load('alpina');
$tree = $variant->get('component_tree');
$shell_uuid = NULL;
foreach ($tree as &$item) {
  if ($item['component_id'] === 'js.alpina_shell') {
    $shell_uuid = $item['uuid'];
    $item['component_version'] = Component::load('js.alpina_shell')->getActiveVersion();
  }
}
unset($item);
if (!$shell_uuid) throw new RuntimeException('Alpina shell missing from the page variant.');
if (!array_filter($tree, static fn($item) => $item['component_id'] === 'js.alpina_footer')) {
  $inputs = [];
  foreach ($meta['alpina_footer']['props']['properties'] as $property => $schema) $inputs[$property] = $schema['examples'][0];
  $footer = alpinaItem('js.alpina_footer', $inputs, $shell_uuid, 'footer');
  $tree[$footer['uuid']] = $footer;
  $created[] = 'footer placed in page variant alpina';
}
$variant->set('component_tree', $tree);
$violations = $variant->getTypedData()->validate();
if ($violations->count()) throw new RuntimeException((string) $violations);
$variant->save();

// Store-logo section on the homepage, after the inspiration grid.
$page = Page::load(16);
$components = $page->get('components')->getValue();
if (!array_filter($components, static fn($item) => $item['component_id'] === 'js.alpina_store_logo')) {
  $props = $meta['alpina_store_logo']['props']['properties'];
  $inputs = ['heading' => $props['heading']['examples'][0], 'text' => $props['text']['examples'][0], 'firstLogo' => ['target_id' => $logo_ids['Hubo']], 'secondLogo' => ['target_id' => $logo_ids['Colos']], 'buttonLabel' => $props['buttonLabel']['examples'][0]];
  $item = alpinaItem('js.alpina_store_logo', $inputs);
  $item['inputs'] = json_encode($inputs, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
  $manager = \Drupal::service(AutoSaveManager::class);
  $draft = $manager->getAutoSaveEntity($page);
  $entry = \Drupal::keyValue('canvas.auto_save')->get('canvas_page:16:en');
  $components[] = $item;
  $page->set('components', $components);
  $violations = $page->validate();
  if ($violations->count()) throw new RuntimeException((string) $violations);
  $page->save();
  // Keep unpublished Canvas edits, and add the section to that draft too.
  if (!$draft->isEmpty()) {
    $pending = $draft->entity;
    $pending_components = $pending->get('components')->getValue();
    $pending_components[] = $item;
    $pending->set('components', $pending_components);
    $account = \Drupal::entityTypeManager()->getStorage('user')->load($entry['owner']);
    $switcher = \Drupal::service('account_switcher');
    $switcher->switchTo($account);
    try {
      $manager->saveEntity($pending, $draft->clientId);
    }
    finally {
      $switcher->switchBack();
    }
    if ($conflict = $manager->getUnresolvedConflictForEntity($page)) $manager->resolveConflict($page, $conflict);
    echo "Preserved existing unpublished Canvas edits and added the section to the draft.\n";
  }
  $created[] = 'store-logo section placed on page 16';
}

foreach (['canvas.js_component.alpina_shell', 'canvas.js_component.alpina_store_logo', 'canvas.js_component.alpina_footer', 'canvas.component.js.alpina_shell', 'canvas.component.js.alpina_store_logo', 'canvas.component.js.alpina_footer', 'canvas.page_variant.alpina', 'canvas_headless.settings'] as $name) {
  $data = \Drupal::service('config.storage')->read($name);
  if ($data === FALSE) throw new RuntimeException("Missing configuration $name");
  file_put_contents("$root/config/sync/$name.yml", Yaml::dump($data, 30, 2));
}
echo $created ? "Created:\n- " . implode("\n- ", $created) . "\n" : "Nothing new; everything already existed.\n";
