#!/bin/sh
set -e

# Configure Nginx port dynamically from $PORT (default 80)
PORT_TO_USE="${PORT:-80}"
echo "Configuring Nginx on port: $PORT_TO_USE"
sed -i "s/listen 80;/listen $PORT_TO_USE;/g" /etc/nginx/http.d/default.conf
sed -i "s/listen \[::\]:80;/listen \[::\]:$PORT_TO_USE;/g" /etc/nginx/http.d/default.conf

# Ensure storage and bootstrap/cache permissions
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/app/public/menu_items
mkdir -p /var/www/html/storage/app/public/categories
mkdir -p /var/www/html/storage/app/public/posters

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate APP_KEY if missing
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Link storage
php artisan storage:link --force || true

# Run database migrations if DB is set
if [ -n "$DATABASE_URL" ] || [ -n "$DB_HOST" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration skipped or failed, continuing..."
fi

echo "Starting Nginx and PHP-FPM via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
