module.exports = {
  apps: [
    {
      name: 'maria-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'maria-frontend',
      script: 'npm',
      args: 'run preview -- --host --port 4173',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
