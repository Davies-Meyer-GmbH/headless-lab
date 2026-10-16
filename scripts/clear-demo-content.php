<?php
/** Remove the imported demo content and components; keep Alpina. */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\JavaScriptComponent;
use Symfony\Component\Yaml\Yaml;

$root = dirname(DRUPAL_ROOT);
$pages = \Drupal::entityTypeManager()->getStorage('canvas_page');
$alpina = $pages->load(16);
if (!$alpina || $alpina->label() !== 'Alpina homepage') throw new RuntimeException('Expected Alpina homepage ID 16 is missing.');
$alpina->setOwnerId(1);
$alpina->save();
\Drupal::configFactory()->getEditable('system.site')->set('page.front', '/page/16')->save();
\Drupal::configFactory()->getEditable('canvas.settings')->set('default_page_variant', 'alpina')->save();
foreach ([4 => 'Random page', 7 => 'Home page', 15 => 'Untitled page'] as $id => $title) {
  $page = $pages->load($id);
  if (!$page) continue;
  if ($page->label() !== $title) throw new RuntimeException("Page $id no longer matches the demo inventory.");
  $page->delete(); echo "Deleted page $id: $title\n";
}
$variant = \Drupal::entityTypeManager()->getStorage('page_variant')->load('testni_tpl');
if ($variant) $variant->delete();
foreach ([1, 2, 3, 4] as $id) {
  $node = \Drupal::entityTypeManager()->getStorage('node')->load($id);
  if ($node) { $node->delete(); echo "Deleted demo node $id\n"; }
}
foreach (range(1, 7) as $id) {
  $media = \Drupal::entityTypeManager()->getStorage('media')->load($id);
  if ($media) { $media->delete(); echo "Deleted demo media $id\n"; }
}
$names = ['pepsico_reviews', 'text', 'spacer', 'footer', 'pepsico_hero', 'card', 'button', 'hero', 'card_container', 'pepsico_button', 'image', 'video', 'pepsico_image', 'blockquote', 'heading', 'section', 'two_column_text', 'pepsico_header', 'grid_container', 'header', 'logo_card', 'accordion', 'main_menu', 'accordion-item'];
foreach ($names as $name) {
  $component = Component::load("js.$name");
  if ($component) $component->delete();
  $js = JavaScriptComponent::load($name);
  if ($js) $js->delete();
}
foreach (range(1, 9) as $id) {
  $link = \Drupal::entityTypeManager()->getStorage('menu_link_content')->load($id);
  if ($link) $link->delete();
}
$ids = ['js.alpina_shell', 'js.alpina_header', 'js.alpina_hero'];
$config = \Drupal::configFactory()->getEditable('canvas_headless.settings');
$frontends = $config->get('frontends');
foreach ($frontends as &$frontend) {
  if ($frontend['url'] === 'http://localhost:3000') $frontend['components'] = $ids;
}
unset($frontend);
$config->set('frontends', $frontends)->save();
foreach (range(1, 7) as $id) {
  $file = \Drupal::entityTypeManager()->getStorage('file')->load($id);
  if ($file && !\Drupal::service('file.usage')->listUsage($file)) {
    $file->delete(); echo "Deleted unused demo file $id\n";
  }
}
foreach (['system.site', 'canvas.settings', 'canvas_headless.settings'] as $name) {
  file_put_contents("$root/config/sync/$name.yml", Yaml::dump(\Drupal::service('config.storage')->read($name), 30, 2));
}
echo 'Alpina is the sole Canvas page and default homepage.' . "\n";
