#!/bin/bash

# Server setup script for dViz on 82.202.142.35
# This script uses docker-compose for PostgreSQL and Redis

set -e

echo "=== dViz Server Setup ==="
echo "Installing Docker and docker-compose..."

# Update system
sudo apt update

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing docker-compose..."
    sudo apt install -y docker-compose
else
    echo "docker-compose already installed"
fi

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

echo "=== Setup complete ==="
echo "Docker and docker-compose are installed."
echo ""
echo "Next steps:"
echo "1. Copy .env to /home/user1/DeVIZ/.env"
echo "2. Start services: cd /home/user1/DeVIZ && docker-compose up -d"
echo "3. Run migrations: cd /home/user1/DeVIZ/backend && export POSTGRES_HOST=db && uv run alembic upgrade head"
echo "4. Restart backend: pm2 restart backend"
