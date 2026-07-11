# DeVIZ / HubNear

**DeVIZ** — мобильный сервис для быстрых сборов на активности рядом.
Находи компанию для спорта, прогулок и групповых занятий за пару кликов.

## Проблема

> «Хочу поиграть в волейбол сегодня вечером, но не с кем».
> «В парке собираются люди поиграть в футбол — как к ним присоединиться?»

В крупных городах люди всё чаще хотят заниматься активностями, но не могут
найти компанию. Существующие решения либо слишком формальные (секции/клубы),
либо не дают гарантии, что мероприятие состоится.

## Решение

DeVIZ — это **маркетплейс спонтанных активностей** с механикой кворума:

- Пользователь создаёт сбор (например, «Волейбол в Парке Горького в 19:00, нужно 12 человек»)
- Другие пользователи видят сбор на карте/в ленте и присоединяются
- Если к дедлайну набран минимум участников — сбор **подтверждается** и идёт нотификация
- Все участники автоматически добавляются в чат мероприятия

## Ценность

- **Для участников**: находить занятия рядом без подписки на клуб
- **Для организаторов**: не ждать в пустую, если кворум не собран
- **Для бизнеса**: площадка для продвижения спортивных событий и мест

## Скриншоты

*(вставьте скриншоты после запуска)*

Для быстрого создания скриншотов:
```bash
# Убедитесь, что backend и frontend запущены
open http://localhost:5173
# Затем используйте Cmd+Shift+4 или инструмент скриншотов
```

Рекомендуемые скриншоты:
1. **Лента активностей** с поиском и фильтром по категориям
2. **Карточка сбора** с прогресс-баром кворума
3. **Чат мероприятия** с сообщениями участников
4. **Профиль пользователя** с местами и статистикой
5. **Форма создания сбора**

## Архитектура

```
docker-compose.yml          # API + PostGIS + Redis + автоматические миграции
Makefile                     # dev / build / test / lint

backend/                     # Python 3.14 + FastAPI
  ├── app/
  │   ├── main.py            # FastAPI app (CORS, security headers, routes)
  │   ├── db.py              # Async SQLAlchemy engine
  │   ├── redis.py           # Redis sessions + rate limiter
  │   ├── core/config.py     # Env-based config
  │   └── api/v1/
  │       ├── routes/        # auth, activities, chats, friends, me, cities, catalog
  │       ├── repositories/  # SQL queries (activity_repo.py)
  │       ├── schemas.py     # Pydantic models
  │       ├── dependencies.py# Bearer token → user_id
  │       └── pagination.py  # Cursor-based pagination
  ├── migrations/            # Alembic (3 migrations)
  └── tests/                 # API smoke tests

HubNear/                     # React 18 + TypeScript + Vite 6 + PWA
  └── src/app/
      ├── api/               # API client (8 модулей)
      ├── hooks/             # Хуки состояния (useHubData)
      ├── components/        # Переиспользуемые компоненты
      ├── screens/           # 15 экранов
      └── constants/         # Стили
```

### Ключевые решения

| Решение | Почему |
|---------|--------|
| **FastAPI + async SQLAlchemy** | Под капотом async PG — масштабируется под нагрузку |
| **PostGIS** | Гео-запросы — радиус, близость, границы города |
| **Триггеры в PostgreSQL** | Кворум, статусы, авто-чат, нотификации — на уровне БД, без race condition |
| **Redis sessions** | Token-based auth с sliding expiration, rate limiter |
| **Bearer token** | Вместо X-User-Id (критическая уязвимость) |
| **Repository pattern** | SQL вынесен из route-файлов — чище, тестируемее |
| **PWA** | Установка на экран, офлайн через service worker |

## Быстрый старт

### Предварительные требования

- Docker & Docker Compose
- Node.js 20+
- Python 3.14+ (опционально, для тестов без Docker)

### 1. Запуск бекенда

```bash
# Копировать конфигурацию и запустить
cp .env.example .env
docker compose up --build
```

Применит миграции, запустит API на `http://localhost:8000`, PostGIS и Redis.
Swagger UI: `http://localhost:8000/docs`.

### 2. Запуск фронтенда

```bash
cd HubNear && npm install && npm run dev
```

Приложение доступно на `http://localhost:5173`.
Vite проксирует `/api` на `http://localhost:8000`.

### 3. Smoke-тесты

```bash
# Требуется запущенный backend
make test
# Или: cd backend && uv run pytest tests/ -v
```

## Деплой на сервер (ecocheck.space)

### Архитектура продакшена

```
                    :8000                    :8001
                  ┌───────┐              ┌────────┐
ecocheck.space ──►│ nginx │── /api ──►  │ FastAPI│
                  │       │             │   :8000 │
                  │ static│             └────┬───┘
                  │ files │                  │
                  └───────┘           ┌──────┴──────┐
                                      │  PostgreSQL  │
                                      │    Redis     │
                                      └─────────────┘
```

### Пошаговая инструкция

#### 1. Подготовка сервера

```bash
# Установить Docker
curl -fsSL https://get.docker.com | sh

# Установить Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установить nginx
sudo apt-get install -y nginx

# Установить certbot для HTTPS
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 2. Клонировать репозиторий

```bash
cd /opt
git clone <repository-url> HubNear
cd HubNear
```

#### 3. Настроить окружение

```bash
# Создать .env файл
cat > .env << 'EOF'
POSTGRES_DB=dvizh
POSTGRES_USER=dvizh
POSTGRES_PASSWORD=<сгенерируйте_надежный_пароль>
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
API_PORT=8001
EOF
```

#### 4. Запустить бекенд и базу данных

```bash
# Запустить в фоновом режиме
docker compose up -d

# Применить миграции
cd backend
export $(grep -v '^#' ../.env | xargs)
uv run alembic upgrade head
cd ..
```

#### 5. Собрать и развернуть фронтенд

```bash
# Собрать фронтенд
cd HubNear
npm install
npm run build
cd ..

# Скопировать файлы
sudo mkdir -p /var/www/ecocheck/landing /var/www/ecocheck/app
sudo cp -r HubNear/dist/* /var/www/ecocheck/app/
sudo cp -r landing/* /var/www/ecocheck/landing/
sudo chown -R www-data:www-data /var/www/ecocheck
```

#### 6. Настроить nginx

```bash
# Скопировать конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/ecocheck

# Активировать сайт
sudo ln -sf /etc/nginx/sites-available/ecocheck /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезапустить nginx
sudo systemctl restart nginx
```

#### 7. Настроить HTTPS (Let's Encrypt)

```bash
# Получить сертификат
sudo certbot --nginx -d ecocheck.space

# Автоматическое обновление сертификатов
sudo systemctl enable certbot.timer
```

#### 8. Настроить автозапуск

```bash
# Создать systemd сервис для бекенда
sudo cat > /etc/systemd/system/ecocheck-api.service << 'EOF'
[Unit]
Description=EcoCheck API
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/HubNear
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ecocheck-api.service
```

### Полезные команды

```bash
# Проверить статус сервисов
docker compose ps

# Посмотреть логи бекенда
docker compose logs -f api

# Пересобрать фронтенд после изменений
cd HubNear && npm run build
sudo cp -r dist/* /var/www/ecocheck/app/

# Обновить лендинг после изменений
sudo cp -r landing/* /var/www/ecocheck/landing/

# Перезапустить nginx
sudo systemctl reload nginx

# Проверить доступность API
curl https://ecocheck.space/health
```

## Стек

| Компонент | Технология |
|-----------|------------|
| Backend | Python 3.14, FastAPI, SQLAlchemy (async), PostgreSQL 18 + PostGIS, Redis 7 |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 4, Radix UI |
| PWA | Vite PWA Plugin, Workbox, manifest |
| Инфра | Docker Compose, Alembic, uv, npm |

## API (основные эндпоинты)

**Swagger UI**: `http://localhost:8000/docs`

### Auth
- `POST /api/v1/auth/register` — регистрация (EmailStr, пароль, имя)
- `POST /api/v1/auth/login` — вход, возвращает Bearer token
- `POST /api/v1/auth/logout` — выход
- `POST /api/v1/auth/logout-all` — выход со всех устройств
- `GET /api/v1/auth/verify` — проверка токена
- `POST /api/v1/auth/password-change` — смена пароля

### Activities
- `GET /api/v1/activities` — лента (пагинация, поиск, geo-фильтр, категории)
- `POST /api/v1/activities` — создание сбора
- `GET /api/v1/activities/{id}` — детали
- `PATCH /api/v1/activities/{id}` — обновление
- `POST /api/v1/activities/{id}/join` — присоединиться
- `POST /api/v1/activities/{id}/leave` — выйти
- `POST /api/v1/activities/{id}/cancel` — отменить
- `GET /api/v1/activities/{id}/participants` — список участников

### Chats / Friends / Me
- `GET/POST /api/v1/chats` — список чатов / создание
- `GET/POST /api/v1/chats/{id}/messages` — сообщения
- `DELETE /api/v1/chats/{id}/members/{uid}` — удалить участника
- `GET/POST/DELETE /api/v1/friends` — друзья
- `POST /api/v1/friends/requests/{id}` — запрос в друзья
- `POST /api/v1/friends/requests/{id}/accept|reject` — ответ на запрос
- `GET/POST/DELETE /api/v1/me/places` — избранные места

### Catalog
- `GET /api/v1/cities` — список городов
- `GET /api/v1/catalog/categories` — категории активностей
- `GET /api/v1/catalog/levels` — уровни подготовки

## Безопасность

- Bearer token в Redis (64-byte `secrets.token_hex(32)`, 24h TTL, sliding expiration)
- bcrypt для паролей
- Политика паролей: 8+ символов, upper+lower+digit+special
- Rate limiter: регистрация (3/ч), логин (20/15мин), смена пароля (5/15мин)
- Валидация email (`email-validator`)
- Email нормализация, скрытие существования email
- CORS (только localhost, `ecocheck.space` и `*.hubnear.app`)
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- PostgreSQL trigger-based валидация (без race condition)
- Секреты только через переменные окружения

## Разработка

### Добавление миграции

```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

### Линтинг

```bash
make lint         # ruff check + ruff format --check
make lint-fix     # ruff check --fix + ruff format
```

## Участие в разработке

1. Форкните репозиторий.
2. Создайте ветку: `git checkout -b feature/your-feature`.
3. Внесите изменения и убедитесь, что `npm run build` и `make lint` проходят.
4. Откройте Pull Request с описанием изменений.

## Лицензия

MIT. См. [LICENSE](LICENSE).

## План развития

- [ ] Уведомления через FCM / push (есть инфраструктура `user_devices`)
- [ ] Карта активностей (PostGIS готов)
- [ ] Комментарии и рейтинг пользователей
- [ ] Интеграция с календарём
- [ ] Онбординг и теги интересов
- [ ] Групповые чаты с голосованиями
- [ ] Интеграция с каршерингом и такси
