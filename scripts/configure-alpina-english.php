<?php
/** Restore English-only authoring while preserving content and native menus. */
use Drupal\language\Entity\ConfigurableLanguage;
use Drupal\language\Entity\ContentLanguageSettings;

$pages = \Drupal::entityTypeManager()->getStorage('canvas_page')->loadMultiple();
foreach ($pages as $page) {
  foreach (['fr', 'nl'] as $code) {
    if ($page->hasTranslation($code)) {
      throw new RuntimeException("Page {$page->id()} has a $code translation; preserve it before removing languages.");
    }
  }
}
// Restore original English configuration labels before deleting language overrides.
$storage = \Drupal::service('config.storage');
$english = $storage->createCollection('language.en');
foreach ($english->listAll() as $name) {
  $base = $storage->read($name);
  if ($base !== FALSE) {
    $merged = \Drupal\Component\Utility\NestedArray::mergeDeepArray([$base, $english->read($name)], TRUE);
    $merged['langcode'] = 'en';
    \Drupal::configFactory()->getEditable($name)->setData($merged)->save();
  }
}
\Drupal::configFactory()->getEditable('system.site')->set('default_langcode', 'en')->save();
$en = ConfigurableLanguage::load('en');
$en->setWeight(0)->save();
require_once dirname(DRUPAL_ROOT) . '/scripts/alpina-header-defaults.php';
$variant = \Drupal\canvas\Entity\PageVariant::load('alpina');
$tree = $variant->get('component_tree');
foreach ($tree as &$item) {
  if ($item['component_id'] === 'js.alpina_header') {
    $item['inputs'] = array_replace($item['inputs'], alpinaHeaderDefaults('en'));
  }
}
unset($item);
$variant->set('langcode', 'en')->set('component_tree', $tree)->save();
foreach (['menu_link_content', 'media'] as $type) {
  foreach (\Drupal::entityTypeManager()->getStorage($type)->loadMultiple() as $entity) {
    if (in_array($entity->language()->getId(), ['fr', 'nl'], TRUE)) {
      if (count($entity->getTranslationLanguages()) > 1) throw new RuntimeException("Translated $type {$entity->id()} must be preserved manually.");
      $entity->set('langcode', 'en')->save();
    }
  }
}
foreach (['fr', 'nl'] as $code) {
  if ($language = ConfigurableLanguage::load($code)) $language->delete();
}
// With one configured language, Canvas hides its language selector.
\Drupal::configFactory()->getEditable('language.negotiation')->set('url.prefixes', ['en' => ''])->set('url.domains', ['en' => ''])->save();
foreach (['canvas_page' => 'canvas_page', 'menu_link_content' => 'menu_link_content', 'media' => 'image'] as $type => $bundle) {
  \Drupal::service('content_translation.manager')->setEnabled($type, $bundle, FALSE);
  $settings = ContentLanguageSettings::loadByEntityTypeBundle($type, $bundle);
  $settings->setLanguageAlterable(FALSE)->save();
}
// English configuration is now the base, so redundant English overrides are removed.
foreach ($english->listAll() as $name) \Drupal::languageManager()->getLanguageConfigOverride('en', $name)->delete();
echo "English-only authoring restored. Existing page content and menu links preserved.\n";
