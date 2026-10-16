<?php
/** A4 fix: restore the full configured component list (was clobbered by the A4 sync script). */
$expected = [
  'js.alpina_full_width_teaser',
  'js.alpina_header',
  'js.alpina_hero',
  'js.alpina_inspo_grid',
  'js.alpina_product_slider',
  'js.alpina_product_teaser',
  'js.alpina_shell',
  'js.alpina_store_logo',
  'js.alpina_footer',
  'js.alpina_async_products',
];
$config = \Drupal::configFactory()->getEditable('canvas_headless.settings');
$frontends = $config->get('frontends');
foreach ($frontends as &$frontend) {
  if ($frontend['url'] === 'http://localhost:3000') {
    $frontend['components'] = $expected;
  }
}
unset($frontend);
$config->set('frontends', $frontends)->save();
print_r(\Drupal::config('canvas_headless.settings')->get('frontends'));
