# Headless Lab

Drupal 11 is the CMS. Next.js renders the public pages. Canvas Headless connects the editor to the React components in `frontend/`.

`https://headless-lab` is Drupal (admin, Canvas board). `http://localhost:3000` is the frontend.

## Requirements

- PHP 8.3 and Composer
- MariaDB or MySQL
- Apache with PHP-FPM (the document root is `web/`)
- Node 22.19 or newer in the 22 line, or Node 24.5+ (`frontend/package.json`)

Add this to `/etc/hosts` (on Windows, the Windows hosts file):

```
127.0.0.1 headless-lab
```

## Drupal

From the project root:

```bash
composer install
```

Create an empty database, for example `headless_lab`.

Copy the local settings and fill in the database, user, and password. `settings.php` only loads this file. The local file is not in git.

```bash
cp web/sites/example.settings.local.php web/sites/default/settings.local.php
```

`settings.local.php` needs at least this:

```php
$databases['default']['default'] = [
  'database' => 'headless_lab',
  'username' => 'drupal',
  'password' => 'secret',
  'prefix' => '',
  'host' => 'localhost',
  'port' => '3306',
  'isolation_level' => 'READ COMMITTED',
  'driver' => 'mysql',
  'namespace' => 'Drupal\\mysql\\Driver\\Database\\mysql',
  'autoload' => 'core/modules/mysql/src/Driver/Database/mysql/',
];

$settings['hash_salt'] = 'generate-a-long-random-string';
$settings['config_sync_directory'] = '../config/sync';
$settings['trusted_host_patterns'] = ['^headless-lab$'];

// Next calls Drupal over HTTP. Without this, image URLs stay http:// and the browser blocks them on the HTTPS site.
$settings['file_public_base_url'] = 'https://headless-lab/sites/default/files';
```

Hash salt:

```bash
openssl rand -hex 32
```

The Simple OAuth keys are not in git. Exported config expects this server's absolute paths (`/var/www/headless-lab/keys/`). If the project lives in that same place:

```bash
mkdir -p keys
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
chmod 640 keys/private.key keys/public.key
```

If the project lives somewhere else, override the paths in `settings.local.php`:

```php
$config['simple_oauth.settings']['private_key'] = '/absolute/path/keys/private.key';
$config['simple_oauth.settings']['public_key'] = '/absolute/path/keys/public.key';
```

Import configuration into the empty database. The command asks for an administrator account. That is a new account for this install. It is not in git.

```bash
vendor/bin/drush site:install --existing-config
vendor/bin/drush cr
```

Apache vhost: `ServerName headless-lab`, document root `.../headless-lab/web`, PHP through the PHP 8.3 FPM socket. The local TLS certificates in `certs/` are not in git. HTTPS is required for the Canvas preview cookies and for images. `file_public_base_url` must use the same host and scheme the browser opens.

Uploaded files (`web/sites/default/files`) are not in git. The `testni tpl` page variant references a media image. After importing config, add that image again in Canvas.

## Frontend

```bash
cd frontend
cp .env.example .env
```

In `.env`:

```
CANVAS_SITE_URL=http://headless-lab
CANVAS_CLIENT_ID=cli
CANVAS_CLIENT_SECRET=secret
```

`CANVAS_SITE_URL` is the address the Next server uses to read Drupal. It can stay `http://` even when the site in the browser is HTTPS. This file is not committed.

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

The Canvas frontend is registered at `http://localhost:3000`. A page Next renders is, for example, `http://localhost:3000/page/4`. The same path on `https://headless-lab/page/4` is Drupal HTML, not Next.

## Where things live

| Path | What it is |
|---|---|
| `frontend/components/` | React components Canvas can use |
| `frontend/app/globals.css` | Tailwind and the frontend's global styles |
| `frontend/lib/` | Reads the Drupal menu and review nodes |
| `config/sync/` | Exported Drupal configuration |
| `web/sites/default/settings.local.php` | Database, hash salt, HTTPS base URL for files |

The PepsiCo components are in the Canvas group PepsiCo: Header, Image, Button, Hero, Reviews. Header reads the Drupal Main navigation menu. Reviews reads published nodes of type Review through JSON:API. The `testni tpl` page variant is Drupal configuration (`canvas.page_variant.testni_tpl`), not a file in the frontend.
