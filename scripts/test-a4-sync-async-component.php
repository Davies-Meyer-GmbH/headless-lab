<?php
/** A4 test: sync the alpina_async_products external component to Canvas. */
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Drupal\canvas_headless\ComponentMetadata;

use Symfony\Component\Yaml\Yaml;

$root = dirname(DRUPAL_ROOT);
$name = 'alpina_async_products';
$metadata = Yaml::parseFile("$root/frontend/components/$name/component.yml");
$metadata['props'] = $metadata['props']['properties'];

$result = \Drupal::service(ExternalComponentSync::class)->synchronize(
  FrontendUrl::fromConfig('http://localhost:3000'),
  ['version' => 1, 'components' => [$metadata]],
);
if ($result['errors']) {
  throw new RuntimeException(implode("\n", $result['errors']));
}
echo 'Sync result: ' . json_encode($result) . "\n";

// Add the component to the frontend's configured component list so future
// full syncs keep it.
$config = \Drupal::configFactory()->getEditable('canvas_headless.settings');
$frontends = $config->get('frontends');
foreach ($frontends as &$frontend) {
  if ($frontend['url'] === 'http://localhost:3000' && !in_array("js.$name", $frontend['components'], TRUE)) {
    $frontend['components'][] = "js.$name";
  }
}
unset($frontend);
$config->set('frontends', $frontends)->save();
echo "Configured component list now: " . implode(', ', $frontends[0]['components']) . "\n";
