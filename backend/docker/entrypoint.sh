#!/bin/sh
set -e

# Configure Nginx port dynamically from $PORT (default 80)
PORT_TO_USE="${PORT:-80}"
echo "Configuring Nginx on port: $PORT_TO_USE"
sed -i "s/listen 80;/listen $PORT_TO_USE;/g" /etc/nginx/http.d/default.conf
sed -i "s/listen \[::\]:80;/listen \[::\]:$PORT_TO_USE;/g" /etc/nginx/http.d/default.conf

# Ensure nginx runtime directory exists
mkdir -p /run/nginx

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

# Ensure .env exists so artisan commands don't fail
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env 2>/dev/null || touch /var/www/html/.env
fi

# Generate APP_KEY if missing
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force || true
fi

# Link storage
php artisan storage:link --force || true

# Run database migrations and seeding
if [ -n "$DATABASE_URL" ] || [ -n "$DB_HOST" ]; then
    # Fix Render internal DATABASE_URL for Alpine Linux:
    # 1. Expand short hostname (dpg-xxx-a) to full external hostname (.singapore-postgres.render.com)
    # 2. Add sslmode=require for external SSL connection
    if [ -n "$DATABASE_URL" ]; then
        # Expand short hostname if no dots in host part
        CURRENT_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
        case "$CURRENT_HOST" in
            *.*) ;; # already full hostname
            dpg-*) DATABASE_URL=$(echo "$DATABASE_URL" | sed "s|@${CURRENT_HOST}|@${CURRENT_HOST}.singapore-postgres.render.com|") ;;
        esac
        # Add sslmode=require
        case "$DATABASE_URL" in
            *sslmode=*) ;; # already has sslmode
            *\?*) DATABASE_URL="${DATABASE_URL}&sslmode=require" ;;
            *)    DATABASE_URL="${DATABASE_URL}?sslmode=require" ;;
        esac
        export DATABASE_URL
        echo "DATABASE_URL configured (hostname expanded + SSL), proceeding..."
    fi
    echo "Waiting for database connection and running migrations..."
    for i in 1 2 3 4 5 6 7 8 9 10; do
        if php artisan migrate --force; then
            echo "Database migrations completed successfully!"
            php artisan db:seed --force || echo "Seeding completed or already seeded."
            break
        fi
        echo "Database not ready yet, retrying in 3 seconds ($i/10)..."
        sleep 3
    done
fi

echo "Starting Nginx and PHP-FPM via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
