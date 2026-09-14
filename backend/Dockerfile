FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies & build tools
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    ca-certificates \
    openssl \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    && update-ca-certificates

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        pdo_mysql \
        zip \
        gd \
        intl \
        bcmath \
        opcache \
        exif

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy configuration files
COPY docker/php.ini $PHP_INI_DIR/conf.d/production.ini
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy composer files first for layer caching
COPY composer.json composer.lock ./

# Install dependencies (no-dev for production)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy full application code
COPY . .

# Run composer autoloader and cleanup
RUN composer dump-autoload --optimize --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose default port
EXPOSE 80 10000

ENTRYPOINT ["/entrypoint.sh"]
