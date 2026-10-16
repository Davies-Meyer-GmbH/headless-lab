<?php

declare(strict_types=1);

namespace Drupal\alpina_cms\Form;

final class ProductInspirationOrderForm extends ProductOrderFormBase {
  protected function orderKey(): string {
    return 'inspiration';
  }
}
