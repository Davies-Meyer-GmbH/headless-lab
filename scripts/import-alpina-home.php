<?php
/**
 * Imports only the first Alpina homepage slice. Run from the project root:
 * vendor/bin/drush --uri=https://headless-lab.local php:script scripts/import-alpina-home.php
 * Only Alpina content is imported; existing editorial input is preserved.
 */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\PageVariant;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Drupal\file\FileInterface;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Symfony\Component\Yaml\Yaml;

$root = dirname(DRUPAL_ROOT);
require_once $root . '/scripts/alpina-header-defaults.php';
$uuid = \Drupal::service('uuid');
$definitions = [];
// Include stored definitions to retain the frontend's existing ownership list.
$frontends = \Drupal::config('canvas_headless.settings')->get('frontends');
foreach ($frontends as $frontend) {
  if ($frontend['url'] !== 'http://localhost:3000') continue;
  foreach ($frontend['components'] as $id) {
    $js = \Drupal::entityTypeManager()->getStorage('js_component')->load(substr($id, 3));
    if ($js) $definitions[] = ['machineName' => $js->id(), 'name' => $js->label(), 'status' => $js->status(), 'props' => $js->get('props') ?: [], 'required' => $js->get('required') ?: [], 'slots' => $js->get('slots') ?: []];
  }
}
$definitions = array_values(array_filter($definitions, static fn($d) => !in_array($d['machineName'], ['alpina_shell', 'alpina_header', 'alpina_hero'], TRUE)));
foreach (['alpina_shell', 'alpina_header', 'alpina_hero'] as $name) {
  $metadata = Yaml::parseFile("$root/frontend/components/$name/component.yml");
  $metadata['props'] = $metadata['props']['properties'];
  $definitions[] = $metadata;
}
$result = \Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'), ['version' => 1, 'components' => $definitions]);
if ($result['errors']) throw new RuntimeException(implode("\n", $result['errors']));
echo 'Components: ' . json_encode(array_intersect_key($result, array_flip(['created', 'updated', 'unchanged', 'warnings']))) . "\n";

$media_ids = [];
$directory = 'public://alpina';
\Drupal::service('file_system')->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
foreach (['desktop' => 'hero-img.jpg', 'mobile' => 'hero-img-m.jpg'] as $key => $filename) {
  $uri = "$directory/$filename";
  $files = \Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri' => $uri]);
  $file = reset($files);
  if (!$file instanceof FileInterface) {
    $file = \Drupal::service('file.repository')->writeData(file_get_contents("$root/alpina-be-frontend/assets/$filename"), $uri, FileExists::Error);
    $file->setPermanent(); $file->save();
  }
  $media_name = "Alpina homepage hero $key";
  $media_storage = \Drupal::entityTypeManager()->getStorage('media');
  $existing = $media_storage->loadByProperties(['bundle' => 'image', 'name' => $media_name]);
  $media = reset($existing);
  if (!$media) {
    $media = $media_storage->create(['bundle' => 'image', 'name' => $media_name, 'status' => 1, 'uid' => 1, 'field_media_image' => ['target_id' => $file->id(), 'alt' => 'Alpinaweiß paint bucket on a wooden table in a bright interior']]);
    $media->save();
  }
  $media_ids[$key] = $media->id();
}
function alpinaItem(string $id, array $inputs, ?string $parent = NULL, ?string $slot = NULL): array {
  $component = Component::load($id);
  if (!$component) throw new RuntimeException("Component missing: $id");
  return ['uuid' => \Drupal::service('uuid')->generate(), 'parent_uuid' => $parent, 'slot' => $slot, 'component_id' => $id, 'component_version' => $component->getActiveVersion(), 'inputs' => json_encode($inputs, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)];
}
// Create once. Re-running must not replace later editorial changes.
$variant = PageVariant::load('alpina');
if (!$variant) {
  $shell = alpinaItem('js.alpina_shell', []);
  $header_metadata = Yaml::parseFile("$root/frontend/components/alpina_header/component.yml");
  $header_inputs = [];
  foreach ($header_metadata['required'] as $property) {
    $header_inputs[$property] = alpinaHeaderDefaults(\Drupal::languageManager()->getDefaultLanguage()->getId())[$property] ?? $header_metadata['props']['properties'][$property]['examples'][0];
  }
  $header = alpinaItem('js.alpina_header', $header_inputs, $shell['uuid'], 'header');
  $marker = alpinaItem('marker.page_content', [], $shell['uuid'], 'content');
  $tree = [];
  foreach ([$shell, $header, $marker] as $item) {
    $item['inputs'] = json_decode($item['inputs'], TRUE);
    if ($item['parent_uuid'] === NULL) unset($item['parent_uuid'], $item['slot']);
    $tree[$item['uuid']] = $item;
  }
  $variant = PageVariant::create(['id' => 'alpina', 'label' => 'Alpina', 'status' => TRUE, 'description' => 'Alpina header and editable page content.', 'component_tree' => $tree]);
  $variant->save();
}
else {
  $tree = $variant->get('component_tree');
  foreach ($tree as &$item) {
    if (($item['parent_uuid'] ?? NULL) === NULL) unset($item['parent_uuid'], $item['slot']);
  }
  unset($item);
  $variant->set('component_tree', $tree);
  $variant->save();
}
// Upgrade header inputs when its CMS contract changes, preserving valid values.
$header_metadata = Yaml::parseFile("$root/frontend/components/alpina_header/component.yml");
$tree = $variant->get('component_tree');
foreach ($tree as &$item) {
  if ($item['component_id'] !== 'js.alpina_header') continue;
  $item['component_version'] = Component::load('js.alpina_header')->getActiveVersion();
  $item['inputs'] = array_intersect_key($item['inputs'], $header_metadata['props']['properties']);
  $defaults = alpinaHeaderDefaults(\Drupal::languageManager()->getDefaultLanguage()->getId());
  foreach ($header_metadata['required'] as $property) {
    if (!array_key_exists($property, $item['inputs'])) {
      $item['inputs'][$property] = $defaults[$property] ?? $header_metadata['props']['properties'][$property]['examples'][0];
    }
  }
}
unset($item);
$variant->set('component_tree', $tree);
// Canvas config-tree translations use the site's default language as base.
// This changes template metadata, not the source page's text or language.
$variant->set('langcode', \Drupal::languageManager()->getDefaultLanguage()->getId());
$variant->save();
$violations = $variant->getTypedData()->validate();
if ($violations->count()) throw new RuntimeException((string) $violations);
$pages = \Drupal::entityTypeManager()->getStorage('canvas_page')->loadByProperties(['title' => 'Alpina homepage']);
$page = reset($pages);
if (!$page) {
  $props = Yaml::parseFile("$root/frontend/components/alpina_hero/component.yml")['props']['properties'];
  $inputs = [];
  foreach (['eyebrow', 'heading', 'text'] as $name) $inputs[$name] = $props[$name]['examples'][0];
  $inputs['desktopImage'] = ['target_id' => $media_ids['desktop']];
  $inputs['mobileImage'] = ['target_id' => $media_ids['mobile']];
  $page = \Drupal::entityTypeManager()->getStorage('canvas_page')->create(['title' => 'Alpina homepage', 'status' => 1, 'owner' => 1, 'page_variant' => 'alpina', 'components' => [alpinaItem('js.alpina_hero', $inputs)], 'path' => ['alias' => '/alpina']]);
  $violations = $page->validate();
  if ($violations->count()) throw new RuntimeException((string) $violations);
  $page->save();
}
\Drupal::configFactory()->getEditable('system.site')->set('page.front', '/page/' . $page->id())->save();
\Drupal::configFactory()->getEditable('canvas.settings')->set('default_page_variant', 'alpina')->save();
// Export Alpina configuration and its default homepage selection.
foreach (['canvas.js_component.alpina_shell', 'canvas.js_component.alpina_header', 'canvas.js_component.alpina_hero', 'canvas.component.js.alpina_shell', 'canvas.component.js.alpina_header', 'canvas.component.js.alpina_hero', 'canvas.page_variant.alpina', 'canvas_headless.settings', 'system.site', 'canvas.settings'] as $name) {
  $data = \Drupal::service('config.storage')->read($name);
  if ($data === FALSE) throw new RuntimeException("Missing configuration $name");
  file_put_contents("$root/config/sync/$name.yml", Yaml::dump($data, 30, 2));
}
echo 'Page ID: ' . $page->id() . "\n";
echo 'Frontend: http://localhost:3000/alpina' . "\n";
echo 'Editor: https://headless-lab.local/canvas/editor/canvas_page/' . $page->id() . "\n";
