<?php

declare(strict_types=1);

namespace Drupal\alpina_cms\Form;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\NodeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Rearranges the product order that Alpina product sliders display.
 */
abstract class ProductOrderFormBase extends FormBase {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {
  }

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get(EntityTypeManagerInterface::class),
    );
  }

  abstract protected function orderKey(): string;

  public function getFormId(): string {
    return 'alpina_cms_product_' . $this->orderKey() . '_order';
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $products = $this->loadProducts();

    $form['description'] = [
      '#markup' => '<p>' . $this->t('Drag products into the order used by this component. The component chooses how many products to display from the top of this order.') . '</p>',
    ];

    if (!$products) {
      $form['empty'] = [
        '#markup' => '<p>' . $this->t('There are no Product nodes yet. Create products first.') . '</p>',
      ];
      return $form;
    }

    $form['products'] = [
      '#type' => 'table',
      '#header' => [
        $this->t('Product'),
        $this->t('Weight'),
      ],
      '#empty' => $this->t('There are no Product nodes yet.'),
      '#attributes' => ['id' => 'product-' . $this->orderKey() . '-order'],
      '#tabledrag' => [
        [
          'action' => 'order',
          'relationship' => 'sibling',
          'group' => 'product-' . $this->orderKey() . '-weight',
        ],
      ],
    ];

    $delta = max(count($products), 10);
    foreach ($products as $nid => $product) {
      $label = (string) $product->label();
      $form['products'][$nid]['#attributes']['class'][] = 'draggable';
      $form['products'][$nid]['title'] = [
        '#type' => 'container',
        'name' => [
          '#plain_text' => $product->isPublished() ? $label : $this->t('@label (unpublished)', ['@label' => $label]),
        ],
        'code' => [
          '#prefix' => '<div class="description">',
          '#plain_text' => (string) ($product->get('field_product_code')->value ?? ''),
          '#suffix' => '</div>',
        ],
      ];
      $form['products'][$nid]['weight'] = [
        '#type' => 'weight',
        '#title' => $this->t('Weight for @label', ['@label' => $label]),
        '#title_display' => 'invisible',
        '#default_value' => (int) ($product->get('field_' . $this->orderKey() . '_weight')->value ?? 0),
        '#delta' => $delta,
        '#attributes' => ['class' => ['product-' . $this->orderKey() . '-weight']],
      ];
    }

    $form['actions'] = ['#type' => 'actions'];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#button_type' => 'primary',
      '#value' => $this->t('Save product order'),
    ];

    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $rows = (array) $form_state->getValue('products');
    $products = $this->entityTypeManager->getStorage('node')->loadMultiple(array_keys($rows));

    $saved = 0;
    foreach ($rows as $nid => $row) {
      $product = $products[$nid] ?? NULL;
      $weight = (int) $row['weight'];
      if (!$product instanceof NodeInterface
        || $product->bundle() !== 'product'
        || (int) ($product->get('field_' . $this->orderKey() . '_weight')->value ?? 0) === $weight) {
        continue;
      }
      $product->set('field_' . $this->orderKey() . '_weight', $weight);
      $product->save();
      $saved++;
    }

    $this->messenger()->addStatus($saved > 0
      ? $this->t('Saved the order of @count products.', ['@count' => $saved])
      : $this->t('The product order is unchanged.'));
  }

  /**
   * @return \Drupal\node\NodeInterface[]
   *   All Product nodes, slider weight first, then title.
   */
  private function loadProducts(): array {
    $storage = $this->entityTypeManager->getStorage('node');
    $nids = $storage->getQuery()
      ->accessCheck(FALSE)
      ->condition('type', 'product')
      ->sort('field_' . $this->orderKey() . '_weight')
      ->sort('title')
      ->execute();
    return $storage->loadMultiple($nids);
  }

}
