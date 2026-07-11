# dViz Deployment Guide for Server 82.202.142.35

## Prerequisites
- SSH access to server 82.202.142.35
- User: user1
- Project location: /home/user1/DeVIZ

## Step 1: Upload Setup Script

Upload `setup-server.sh` to the server:
```bash
scp setup-server.sh user1@82.202.142.35:/home/user1/
```

## Step 2: Run Setup Script on Server

SSH into the server and run the setup script:
```bash
ssh user1@82.202.142.35
cd /home/user1
chmod +x setup-server.sh
./setup-server.sh
```

This will:
- Install Docker
- Install docker-compose
- Start Docker service

## Step 3: Upload .env File

Upload the .env file to the project directory:
```bash
scp .env user1@82.202.142.35:/home/user1/DeVIZ/.env
```

## Step 4: Start Docker Services

SSH into the server and start PostgreSQL and Redis via docker-compose:
```bash
ssh user1@82.202.142.35
cd /home/user1/DeVIZ
docker-compose up -d
```

## Step 5: Run Database Migrations

SSH into the server and run migrations:
```bash
ssh user1@82.202.142.35
cd /home/user1/DeVIZ/backend
export POSTGRES_HOST=db
export $(grep -v '^#' ../.env | xargs)
uv run alembic upgrade head
```

## Step 6: Restart Backend

Restart the backend process with PM2:
```bash
pm2 restart backend
```

## Step 7: Verify Services

Check that all services are running:
```bash
# Check Docker containers
docker ps

# Check backend
pm2 status

# Check backend logs
pm2 logs backend --lines 20
```

## Step 7: Test Registration

Test the registration endpoint:
```bash
curl -X POST http://82.202.142.35/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "city_id": "00000000-0000-0000-0000-000000000001",
    "timezone": "Europe/Moscow"
  }'
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

### Redis Connection Issues
```bash
# Check if Redis is running
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

### Backend Issues
```bash
# Check backend logs
pm2 logs backend --lines 50

# Restart backend
pm2 restart backend

# Check environment variables
cd /home/user1/DeVIZ/backend
cat .env
```

### Database Migration Issues
```bash
# Check migration status
cd /home/user1/DeVIZ/backend
uv run alembic current

# Reset migrations (CAUTION: deletes data)
uv run alembic downgrade base
uv run alembic upgrade head
```

## Firewall Configuration

Ensure ports are open:
```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443) if using SSL
sudo ufw allow 443/tcp

# Allow backend port (8001) for local access only
sudo ufw allow from 127.0.0.1 to any port 8001

# Enable firewall
sudo ufw enable
```

## Nginx Configuration

Nginx is already configured for ecocheck.space. Ensure it's running:
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

## Verification

After setup, verify:
1. Frontend accessible at http://ecocheck.space
2. Backend API at http://ecocheck.space/api
3. Registration works
4. Database tables created
5. Redis connection working
