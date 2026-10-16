<?php

declare(strict_types=1);

namespace Drupal\alpina_cms\Form;

final class ProductSliderOrderForm extends ProductOrderFormBase {
  protected function orderKey(): string {
    return 'slider';
  }
}
