module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "/home/user1/DeVIZ/HubNear",
      script: "npx",
      args: "vite preview --host 0.0.0.0 --port 8000",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "256M",
      autorestart: true,
      restart_delay: 3000,
    },
    {
      name: "backend",
      cwd: "/home/user1/DeVIZ",
      script: "bash",
      args: [
        "-c",
        "cd backend && export $(grep -v '^#' .env | xargs) && uv run uvicorn main:app --host 0.0.0.0 --port 8001",
      ],
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: 5000,
    },
  ],
};
