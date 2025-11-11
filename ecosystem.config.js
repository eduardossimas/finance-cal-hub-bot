module.exports = {
  apps: [{
    name: 'finance-cal-hub-bot',
    script: './dist/index.js',
exec_mode: "fork",
    instances: 1,
    autorestart: true,
    watch: false, // IMPORTANTE: Desabilitar watch
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Ignorar mudanças nestes arquivos/pastas
    ignore_watch: [
      'node_modules',
      'auth_info_baileys',
      'logs',
      '.git'
    ],
    // Atraso para evitar restarts múltiplos
    restart_delay: 5000,
    // Máximo de restarts em 1 minuto
    max_restarts: 3,
    min_uptime: '10s'
  }]
};
