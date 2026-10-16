<?php
/** Initial CMS values only; published header text is read from editable inputs. */
function alpinaHeaderDefaults(string $language): array {
  return match ($language) {
    'fr' => ['logoLabel' => 'Alpina', 'menuLabel' => 'Navigation principale', 'openMenuLabel' => 'Ouvrir le menu', 'closeMenuLabel' => 'Fermer le menu', 'untranslatedLabel' => 'Traduction pas encore disponible'],
    'nl' => ['logoLabel' => 'Alpina', 'menuLabel' => 'Hoofdnavigatie', 'openMenuLabel' => 'Menu openen', 'closeMenuLabel' => 'Menu sluiten', 'untranslatedLabel' => 'Vertaling nog niet beschikbaar'],
    default => ['logoLabel' => 'Alpina', 'menuLabel' => 'Main navigation', 'openMenuLabel' => 'Open menu', 'closeMenuLabel' => 'Close menu', 'untranslatedLabel' => 'Translation not yet available'],
  };
}
