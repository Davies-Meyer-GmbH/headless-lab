<?php
/**
 * B2 test: sync the legal shell + rich text components, create the 'legal'
 * page variant, and a Canvas page at /legal using it.
 */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Symfony\Component\Yaml\Yaml;

$root = dirname(DRUPAL_ROOT);
$names = ['alpina_legal_shell', 'alpina_rich_text'];
$definitions = [];
foreach ($names as $name) {
  $metadata = Yaml::parseFile("$root/frontend/components/$name/component.yml");
  $metadata['props'] = $metadata['props']['properties'] ?? [];
  $definitions[] = $metadata;
}
$result = \Drupal::service(ExternalComponentSync::class)->synchronize(
  FrontendUrl::fromConfig('http://localhost:3000'),
  ['version' => 1, 'components' => $definitions],
);
if ($result['errors']) {
  throw new RuntimeException(implode("\n", $result['errors']));
}
echo 'Sync: ' . json_encode(['created' => $result['created'], 'updated' => $result['updated']]) . "\n";

// Keep the configured component list complete.
$config = \Drupal::configFactory()->getEditable('canvas_headless.settings');
$frontends = $config->get('frontends');
foreach ($frontends as &$frontend) {
  if ($frontend['url'] === 'http://localhost:3000') {
    foreach ($names as $name) {
      if (!in_array("js.$name", $frontend['components'], TRUE)) {
        $frontend['components'][] = "js.$name";
      }
    }
  }
}
unset($frontend);
$config->set('frontends', $frontends)->save();

$shell = Component::load('js.alpina_legal_shell');
$footer = Component::load('js.alpina_footer');
if (!$shell || !$footer) {
  throw new RuntimeException('Missing components after sync.');
}
$uuid = \Drupal::service('uuid')->generate();

// Page variant 'legal': legal shell root, content marker, footer slot.
$storage = \Drupal::entityTypeManager()->getStorage('page_variant');
$variant = $storage->load('legal');
if (!$variant) {
  $tree = [
    ['uuid' => $uuid, 'component_id' => 'js.alpina_legal_shell', 'component_version' => $shell->getActiveVersion(), 'parent_uuid' => NULL, 'slot' => NULL, 'inputs' => '{}'],
  ];
  $tree[] = ['uuid' => \Drupal::service('uuid')->generate(), 'component_id' => 'marker.page_content', 'component_version' => Component::load('marker.page_content')->getActiveVersion(), 'parent_uuid' => $uuid, 'slot' => 'content', 'inputs' => '{}'];
  $footerInputs = ['facebookLink' => 'https://www.facebook.com/', 'instagramLink' => 'https://www.instagram.com/', 'pinterestLink' => 'https://www.pinterest.com/', 'youTubeLink' => 'https://www.youtube.com/'];
  $tree[] = ['uuid' => \Drupal::service('uuid')->generate(), 'component_id' => 'js.alpina_footer', 'component_version' => $footer->getActiveVersion(), 'parent_uuid' => $uuid, 'slot' => 'footer', 'inputs' => json_encode($footerInputs, JSON_THROW_ON_ERROR)];
  $variant = $storage->create([
    'id' => 'legal',
    'label' => 'Legal',
    'component_tree' => $tree,
    'settings' => ['show_title' => FALSE],
  ]);
  $variant->save();
}
echo "Variant: {$variant->id()}\n";

// Canvas page /legal with the legal variant and one rich-text block.
$richText = Component::load('js.alpina_rich_text');
$pageStorage = \Drupal::entityTypeManager()->getStorage('canvas_page');
$existing = $pageStorage->loadByProperties(['title' => 'Legal (B2)']);
$page = reset($existing);
if (!$page) {
  $legalText = "<p class=\"body-md\">Datenschutzerklärung</p>"
    . "<div class=\"legal-body__block\"><p class=\"body-md\">1. Allgemeine Hinweise</p>"
    . "<p class=\"body-md\">Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>"
    . "<p class=\"body-md\">(Auszug — diese Seite ist eine Canvas-Seite auf der Page-Variante <em>legal</em>; der Text ist eine alpina_rich_text-Komponente und im Canvas-Editor editierbar. Die Next.js-eigene Variante liegt unter /legal-next.)</p></div>";
  $page = $pageStorage->create([
    'title' => 'Legal (B2)',
    'status' => 1,
    'owner' => 1,
    'langcode' => 'en',
    'page_variant' => 'legal',
    'components' => [[
      'uuid' => \Drupal::service('uuid')->generate(),
      'component_id' => 'js.alpina_rich_text',
      'component_version' => $richText->getActiveVersion(),
      'parent_uuid' => NULL,
      'slot' => NULL,
      'inputs' => json_encode(['text' => $legalText], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
    ]],
    'path' => ['alias' => '/legal'],
  ]);
  $violations = $page->validate();
  if ($violations->count()) {
    throw new RuntimeException((string) $violations);
  }
  $page->save();
}
echo "Page: {$page->id()}\nPublic: http://localhost:3000/legal\nEditor: https://headless-lab.local/canvas/editor/canvas_page/{$page->id()}\n";
