<?php
/** A4 test: place the async server component on a Canvas page and view it. */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;

$storage = \Drupal::entityTypeManager()->getStorage('canvas_page');
$existing = $storage->loadByProperties(['title' => 'A4 async component test']);
$page = reset($existing);
if (!$page) {
  $component = Component::load('js.alpina_async_products');
  if (!$component) {
    throw new RuntimeException('js.alpina_async_products not found — run test-a4-sync-async-component.php first.');
  }
  $uuid = \Drupal::service('uuid')->generate();
  $page = $storage->create([
    'title' => 'A4 async component test',
    'status' => 1,
    'owner' => 1,
    'langcode' => 'en',
    'page_variant' => 'alpina',
    'components' => [[
      'uuid' => $uuid,
      'component_id' => 'js.alpina_async_products',
      'component_version' => $component->getActiveVersion(),
      'parent_uuid' => NULL,
      'slot' => NULL,
      'inputs' => json_encode(['heading' => 'A4 async server component'], JSON_THROW_ON_ERROR),
    ]],
    'path' => ['alias' => '/a4-async'],
  ]);
  $violations = $page->validate();
  if ($violations->count()) {
    throw new RuntimeException((string) $violations);
  }
  $page->save();
}
echo "Canvas page ID: {$page->id()}\nPublic: http://localhost:3000/a4-async\nEditor: https://headless-lab.local/canvas/editor/canvas_page/{$page->id()}\n";
