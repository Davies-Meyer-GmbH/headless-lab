<?php

/**
 * @file
 * Local settings loader. Database and overrides live in settings.local.php.
 */

include __DIR__ . '/default.settings.php';

if (file_exists(__DIR__ . '/settings.local.php')) {
  include __DIR__ . '/settings.local.php';
}
