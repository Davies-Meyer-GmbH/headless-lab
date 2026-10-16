<?php
/** A1 test: create a Canvas page at /test-route, conflicting with app/test-route/page.tsx. */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;

$storage = \Drupal::entityTypeManager()->getStorage('canvas_page');
$existing = $storage->loadByProperties(['title' => 'A1 route conflict']);
$page = reset($existing);
if (!$page) {
  // Minimal tree: one text component directly in the page root, so we can
  // tell Canvas content apart from the Next.js page.
  $component = Component::load('js.alpina_hero');
  if (!$component) {
    throw new RuntimeException('js.alpina_hero component not found — has the frontend manifest been synced?');
  }
  $version = $component->getActiveVersion();
  $uuid = \Drupal::service('uuid')->generate();
  $inputs = json_encode([
    'heading' => 'A1 CANVAS PAGE — Drupal wins',
    'mediaType' => 'image',
  ], JSON_THROW_ON_ERROR);
  $page = $storage->create([
    'title' => 'A1 route conflict',
    'status' => 1,
    'owner' => 1,
    'langcode' => 'en',
    'page_variant' => 'alpina',
    'components' => [[
      'uuid' => $uuid,
      'component_id' => 'js.alpina_hero',
      'component_version' => $version,
      'parent_uuid' => NULL,
      'slot' => NULL,
      'inputs' => $inputs,
    ]],
    'path' => ['alias' => '/test-route'],
  ]);
  $violations = $page->validate();
  if ($violations->count()) {
    throw new RuntimeException((string) $violations);
  }
  $page->save();
}
echo "Canvas page ID: {$page->id()}\nPublic: http://localhost:3000/test-route\nEditor: https://headless-lab.local/canvas/editor/canvas_page/{$page->id()}\n";
