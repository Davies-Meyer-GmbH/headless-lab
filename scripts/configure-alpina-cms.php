<?php
/** Historical multilingual setup. Superseded by configure-alpina-english.php. */
throw new RuntimeException("Multilingual setup is deferred. Use scripts/configure-alpina-english.php instead.");
use Drupal\language\Entity\ConfigurableLanguage;
use Drupal\language\Entity\ContentLanguageSettings;
use Symfony\Component\Yaml\Yaml;

foreach (['fr', 'nl'] as $code) {
  if (!ConfigurableLanguage::load($code)) ConfigurableLanguage::createFromLangcode($code)->save();
}
foreach (['fr' => 0, 'nl' => 1, 'en' => 2] as $code => $weight) {
  $language = ConfigurableLanguage::load($code);
  if ($language) $language->setWeight($weight)->save();
}
\Drupal::configFactory()->getEditable('system.site')->set('default_langcode', 'fr')->save();
$prefixes = [];
foreach (\Drupal::languageManager()->getLanguages() as $code => $language) $prefixes[$code] = $code;
\Drupal::configFactory()->getEditable('language.negotiation')->set('url.source', 'path_prefix')->set('url.prefixes', $prefixes)->save();
\Drupal::configFactory()->getEditable('language.types')->set('negotiation.language_content.enabled', ['language-url' => 0, 'language-interface' => 1])->save();
\Drupal::configFactory()->getEditable('system.feature_flags')->set('linkset_endpoint', TRUE)->save();
foreach (['canvas_page' => 'canvas_page', 'menu_link_content' => 'menu_link_content', 'media' => 'image'] as $type => $bundle) {
  \Drupal::service('content_translation.manager')->setEnabled($type, $bundle, TRUE);
  $settings = ContentLanguageSettings::loadByEntityTypeBundle($type, $bundle);
  $settings->setLanguageAlterable(TRUE)->save();
}
// Keep /alpina usable for the default language and untranslated fallback routes.
$aliases = \Drupal::entityTypeManager()->getStorage('path_alias')->loadByProperties(['path' => '/page/16', 'alias' => '/alpina', 'langcode' => 'und']);
if (!$aliases) {
  \Drupal::entityTypeManager()->getStorage('path_alias')->create(['path' => '/page/16', 'alias' => '/alpina', 'langcode' => 'und'])->save();
}
$links = \Drupal::entityTypeManager()->getStorage('menu_link_content')->loadByProperties(['menu_name' => 'main']);
if (!$links) {
  \Drupal::entityTypeManager()->getStorage('menu_link_content')->create(['title' => 'Alpina', 'menu_name' => 'main', 'link' => ['uri' => 'entity:canvas_page/16'], 'langcode' => 'fr', 'enabled' => TRUE, 'weight' => 0])->save();
}
// Keep the existing admin account's interface preference explicit.
$admin = \Drupal::entityTypeManager()->getStorage('user')->load(1);
if ($admin && !$admin->get('preferred_admin_langcode')->value) {
  $admin->set('preferred_admin_langcode', 'en')->save();
}
// Drupal core image media uses a PNG export of the unchanged reference SVG.
$logo_uri = 'public://alpina/logo.png';
$logo_files = \Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri' => $logo_uri]);
$logo_file = reset($logo_files);
if (!$logo_file) {
  $logo_file = \Drupal::service('file.repository')->writeData(file_get_contents(dirname(DRUPAL_ROOT) . '/frontend/public/alpina/img/_icn/logo-cms.png'), $logo_uri, \Drupal\Core\File\FileExists::Error);
  $logo_file->setPermanent(); $logo_file->save();
}
$logos = \Drupal::entityTypeManager()->getStorage('media')->loadByProperties(['bundle' => 'image', 'name' => 'Alpina logo']);
$logo = reset($logos);
if (!$logo) {
  $logo = \Drupal::entityTypeManager()->getStorage('media')->create(['bundle' => 'image', 'name' => 'Alpina logo', 'langcode' => 'fr', 'status' => 1, 'uid' => 1, 'field_media_image' => ['target_id' => $logo_file->id(), 'alt' => 'Alpina']]);
  $logo->save();
}
// Store header UI text as real, translatable CMS inputs, not code-only defaults.
$variant = \Drupal\canvas\Entity\PageVariant::load('alpina');
$header_component = \Drupal\canvas\Entity\Component::load('js.alpina_header');
require_once dirname(DRUPAL_ROOT) . '/scripts/alpina-header-defaults.php';
$ui = [];
foreach (['fr', 'nl', 'en'] as $code) $ui[$code] = alpinaHeaderDefaults($code);
if ($variant && $header_component) {
  $tree = $variant->get('component_tree');
  foreach ($tree as &$item) {
    if ($item['component_id'] !== 'js.alpina_header') continue;
    $item['component_version'] = $header_component->getActiveVersion();
    $item['inputs'] = array_intersect_key($item['inputs'], array_flip(['logo', 'logoLink', 'logoLabel', 'menuLabel', 'openMenuLabel', 'closeMenuLabel', 'untranslatedLabel']));
    $item['inputs'] += $ui['fr'];
    if (empty($item['inputs']['logo'])) $item['inputs']['logo'] = ['target_id' => $logo->id()];
    foreach (['nl', 'en'] as $code) {
      $override = \Drupal::languageManager()->getLanguageConfigOverride($code, 'canvas.page_variant.alpina');
      foreach ($ui[$code] as $property => $value) {
        $key = 'component_tree.' . $item['uuid'] . '.inputs.' . $property;
        if ($override->get($key) === NULL) $override->set($key, $value);
      }
      $override->save();
    }
  }
  unset($item);
  $variant->set('component_tree', $tree)->save();
}
$root = dirname(DRUPAL_ROOT);
$names = ['core.extension', 'system.site', 'system.feature_flags'];
foreach (['language.', 'locale.'] as $prefix) $names = array_merge($names, \Drupal::service('config.storage')->listAll($prefix));
foreach ($names as $name) {
  file_put_contents("$root/config/sync/$name.yml", Yaml::dump(\Drupal::service('config.storage')->read($name), 30, 2));
}
echo "French and Dutch configured; French default. English retained for existing content and admin.\n";
echo "Page, menu, and image-media translation enabled. Main menu has an editable homepage link.\n";
