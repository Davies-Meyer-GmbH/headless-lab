<?php
/** A6 test: temporarily change the homepage hero heading. Pass "restore" to revert. */
use Drupal\canvas\Entity\Page;

$restore = in_array('restore', (array) ($argv ?? []), TRUE) || in_array('--restore', (array) ($argv ?? []), TRUE);
$original = 'alpina — Deutsch­lands Nr. 1* Jetzt auch in Belgien!';
$marker = 'alpina — A6 CACHE TEST ' . date('His');

$page = Page::load(16);
if (!$page) {
  throw new RuntimeException('Page 16 not found.');
}
$tree = $page->get('components')->getValue();
$changed = FALSE;
foreach ($tree as &$item) {
  if ($item['component_id'] !== 'js.alpina_hero') {
    continue;
  }
  $inputs = json_decode($item['inputs'], TRUE, 512, JSON_THROW_ON_ERROR);
  if (!isset($inputs['heading'])) {
    continue;
  }
  if ($restore) {
    if ($inputs['heading'] !== $original) {
      $inputs['heading'] = $original;
      $changed = TRUE;
    }
  }
  else {
    // Always write a fresh marker so every run changes the content.
    $inputs['heading'] = $marker;
    $changed = TRUE;
  }
  $item['inputs'] = json_encode($inputs, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
}
unset($item);
if ($changed || $restore) {
  $page->set('components', $tree);
  $violations = $page->validate();
  if ($violations->count()) {
    throw new RuntimeException((string) $violations);
  }
  $page->save();
}
echo ($restore ? 'Restored' : 'Changed') . " hero heading on page 16.\n";
