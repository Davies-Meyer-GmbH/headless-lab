<?php

declare(strict_types=1);

namespace Drupal\alpina_cms\EventSubscriber;

use Drupal\Core\Routing\RouteSubscriberBase;
use Drupal\Core\Routing\RoutingEvents;
use Symfony\Component\Routing\RouteCollection;

/** Keep translation forms in the admin theme instead of the public page shell. */
final class TranslationAdminRoutesSubscriber extends RouteSubscriberBase {

  public static function getSubscribedEvents(): array {
    // Core adds content-translation routes at priority -210.
    return [RoutingEvents::ALTER => ['onAlterRoutes', -220]];
  }

  protected function alterRoutes(RouteCollection $collection): void {
    foreach ($collection as $name => $route) {
      if (str_starts_with($name, 'entity.canvas_page.content_translation_')) {
        $route->setOption('_admin_route', TRUE);
      }
    }
  }

}
