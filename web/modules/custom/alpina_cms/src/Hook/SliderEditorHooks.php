<?php

declare(strict_types=1);

namespace Drupal\alpina_cms\Hook;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Url;

/** Adds editorial navigation to the product slider's Canvas settings. */
final class SliderEditorHooks {

  #[Hook('form_component_instance_form_alter')]
  public function componentInstanceFormAlter(array &$form, FormStateInterface $form_state): void {
    $tree = json_decode($form['form_canvas_tree']['#value'] ?? '', TRUE);
    $component_id = explode('@', $tree['type'] ?? '')[0];
    $inspiration = $component_id === 'js.alpina_inspo_grid';
    if ($component_id !== 'js.alpina_product_slider' && !$inspiration) {
      return;
    }
    $uuid = $form['form_canvas_selected']['#value'] ?? '';
    if (!isset($form['canvas_component_props'][$uuid])) {
      return;
    }
    $form['canvas_component_props'][$uuid]['alpina_product_order'] = [
      '#type' => 'container',
      '#weight' => 100,
      '#access' => \Drupal::currentUser()->hasPermission($inspiration ? 'administer product inspiration order' : 'administer product slider order'),
      '#attributes' => ['style' => 'margin-top: 12px;'],
      'link' => [
        '#type' => 'link',
        '#title' => $inspiration ? t('Order inspiration products') : t('Order products'),
        '#url' => Url::fromRoute($inspiration ? 'alpina_cms.product_inspiration_order' : 'alpina_cms.product_slider_order'),
        '#attributes' => [
          'target' => '_blank',
          'rel' => 'noopener noreferrer',
          // Match the buttons already used by Canvas's Radix-based sidebar.
          'class' => ['rt-reset', 'rt-BaseButton', 'rt-Button', 'rt-r-size-2', 'rt-variant-soft'],
        ],
      ],
    ];
  }

}
