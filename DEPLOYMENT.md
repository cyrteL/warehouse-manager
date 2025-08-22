# 🚀 Инструкции по развертыванию в продакшн

## 📋 Предварительные требования

### Системные требования
- **Node.js** 18+ LTS
- **MySQL** 8.0+
- **Nginx** (рекомендуется для прокси)
- **PM2** (для управления процессами)

### Минимальные характеристики сервера
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB SSD
- **Сеть**: 100 Mbps

## 🔧 Установка и настройка

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Установка PM2
sudo npm install -g pm2

# Установка Nginx
sudo apt install nginx -y
```

### 2. Настройка базы данных

```sql
-- Подключение к MySQL
sudo mysql

-- Создание базы данных
CREATE DATABASE warehouse_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'warehouse_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON warehouse_manager.* TO 'warehouse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Настройка приложения

```bash
# Клонирование проекта
git clone https://github.com/your-repo/warehouse-manager.git
cd warehouse-manager

# Установка зависимостей
cd server
npm install --production

# Создание production конфигурации
cp env.production.example .env
nano .env
```

### 4. Конфигурация .env

```env
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=warehouse_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=warehouse_manager

# Security Configuration
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE
JWT_EXPIRES_IN=8h

# CORS Configuration
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Performance
CONNECTION_LIMIT=20
QUEUE_LIMIT=0
```

### 5. Инициализация базы данных

```bash
# Создание таблиц
npm run migrate

# Заполнение тестовыми данными
npm run seed

# ИЛИ полная настройка
npm run setup:prod
```

### 6. Настройка PM2

```bash
# Создание PM2 конфигурации
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'warehouse-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
EOF

# Создание директории для логов
mkdir -p logs

# Запуск приложения
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Настройка Nginx

```bash
# Создание конфигурации
sudo nano /etc/nginx/sites-available/warehouse-manager
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Статические файлы фронтенда
    location / {
        root /var/www/warehouse-manager;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Кэширование
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API прокси
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/warehouse-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. Развертывание фронтенда

```bash
# Копирование файлов
sudo cp -r . /var/www/warehouse-manager/
sudo chown -R www-data:www-data /var/www/warehouse-manager/
sudo chmod -R 755 /var/www/warehouse-manager/
```

## 🔒 Безопасность

### Обязательные меры безопасности

1. **Измените пароли по умолчанию:**
   ```sql
   UPDATE users SET password_hash = 'NEW_HASHED_PASSWORD' WHERE username = 'admin';
   ```

2. **Настройте файрвол:**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw deny 3001  # Блокируем прямой доступ к API
   ```

3. **Регулярные обновления:**
   ```bash
   # Автоматические обновления безопасности
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. **Мониторинг логов:**
   ```bash
   # Просмотр логов приложения
   pm2 logs warehouse-api
   
   # Просмотр логов Nginx
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

## 📊 Мониторинг и обслуживание

### PM2 команды

```bash
# Статус приложений
pm2 status

# Перезапуск
pm2 restart warehouse-api

# Обновление кода
pm2 reload warehouse-api

# Просмотр логов
pm2 logs warehouse-api

# Мониторинг ресурсов
pm2 monit
```

### Резервное копирование

```bash
# Скрипт резервного копирования
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/warehouse-manager"

# Создание резервной копии БД
mysqldump -u warehouse_user -p warehouse_manager > $BACKUP_DIR/db_$DATE.sql

# Сжатие
gzip $BACKUP_DIR/db_$DATE.sql

# Удаление старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x backup.sh

# Добавление в cron (ежедневно в 2:00)
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🚨 Устранение неполадок

### Частые проблемы

1. **Приложение не запускается:**
   ```bash
   pm2 logs warehouse-api
   tail -f logs/err.log
   ```

2. **Ошибки подключения к БД:**
   ```bash
   mysql -u warehouse_user -p warehouse_manager
   ```

3. **Проблемы с Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Проблемы с SSL:**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs warehouse-api`
2. Проверьте статус сервисов: `pm2 status`, `sudo systemctl status nginx`
3. Проверьте конфигурацию: `nginx -t`, `node -c src/server.js`
