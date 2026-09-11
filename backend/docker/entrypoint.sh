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

# Resolve Render short database hostname (dpg-xxx-a) to external regional domain
if [ -n "$DB_HOST" ]; then
    case "$DB_HOST" in
        *.*) ;; # already full hostname
        dpg-*)
            echo "Detecting working PostgreSQL host for $DB_HOST..."
            RESOLVED_HOST=$(php -r '
                $base = getenv("DB_HOST");
                $user = getenv("DB_USERNAME");
                $pass = getenv("DB_PASSWORD");
                $db   = getenv("DB_DATABASE");
                $port = getenv("DB_PORT") ?: 5432;

                if (gethostbyname($base) !== $base) {
                    try {
                        $dsn = "pgsql:host={$base};port={$port};dbname={$db};sslmode=prefer";
                        new PDO($dsn, $user, $pass, [PDO::ATTR_TIMEOUT => 2]);
                        echo $base;
                        exit(0);
                    } catch (\Throwable $e) {
                        try {
                            $dsn = "pgsql:host={$base};port={$port};dbname={$db};sslmode=disable";
                            new PDO($dsn, $user, $pass, [PDO::ATTR_TIMEOUT => 2]);
                            echo $base;
                            exit(0);
                        } catch (\Throwable $e2) {}
                    }
                }

                foreach (["oregon", "singapore", "frankfurt", "ohio"] as $r) {
                    $candidate = "{$base}.{$r}-postgres.render.com";
                    try {
                        $dsn = "pgsql:host={$candidate};port={$port};dbname={$db};sslmode=require";
                        new PDO($dsn, $user, $pass, [PDO::ATTR_TIMEOUT => 3]);
                        echo $candidate;
                        exit(0);
                    } catch (\Throwable $e) {}
                }

                echo "{$base}.oregon-postgres.render.com";
            ')
            if [ -n "$RESOLVED_HOST" ]; then
                export DB_HOST="$RESOLVED_HOST"
                case "$RESOLVED_HOST" in
                    *.render.com) export DB_SSLMODE="require" ;;
                    *)            export DB_SSLMODE="prefer" ;;
                esac
                echo "Resolved DB_HOST to: $DB_HOST (sslmode=$DB_SSLMODE)"
            fi
            ;;
    esac
fi

if [ -n "$DATABASE_URL" ]; then
    CURRENT_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
    case "$CURRENT_HOST" in
        *.*) ;;
        dpg-*)
            DATABASE_URL=$(echo "$DATABASE_URL" | sed "s|@${CURRENT_HOST}|@${CURRENT_HOST}.singapore-postgres.render.com|")
            ;;
    esac
    case "$DATABASE_URL" in
        *sslmode=*) ;;
        *\?*) DATABASE_URL="${DATABASE_URL}&sslmode=require" ;;
        *)    DATABASE_URL="${DATABASE_URL}?sslmode=require" ;;
    esac
    export DATABASE_URL
fi

# Cache configuration and routes for production performance
echo "Caching configuration..."
php artisan config:cache || echo "Warning: config cache failed, continuing..."
php artisan route:cache || echo "Warning: route cache failed, continuing..."

# Run database migrations and seeding
if [ -n "$DB_HOST" ] || [ -n "$DATABASE_URL" ]; then
    echo "Database configured, running migrations..."
    for i in 1 2 3 4 5 6 7 8 9 10; do
        if php artisan migrate --force; then
            echo "Database migrations completed successfully!"
            php artisan db:seed --force || echo "Seeding completed or already seeded."
            break
        fi
        echo "Database migration attempt $i/10 failed, retrying in 3 seconds..."
        sleep 3
    done
fi

echo "Starting Nginx and PHP-FPM via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
