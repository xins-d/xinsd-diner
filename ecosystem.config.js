/**
 * PM2 进程管理器配置文件
 * 用于在服务器上管理和监控 Next.js 应用
 */

module.exports = {
  apps: [
    {
      name: 'xinsd-diner',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1, // 或使用 'max' 启动集群模式
      exec_mode: 'fork', // 或 'cluster' 用于负载均衡
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,
      time: true,
      
      // 自动重启配置
      autorestart: true,
      watch: false, // 生产环境建议关闭文件监听
      max_memory_restart: '500M', // 内存超过 500MB 自动重启
      
      // 启动延迟和重试
      min_uptime: '10s', // 至少运行 10 秒才认为是正常启动
      max_restarts: 10, // 10 次重启后停止尝试
      restart_delay: 4000, // 重启延迟 4 秒
      
      // 忽略监听的文件（性能优化）
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '*.log',
        'data',
        'public/uploads',
      ],
      
      // 环境变量文件
      env_file: '.env.local',
    },
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/xinsd-diner.git',
      path: '/var/www/xinsd-diner',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
}
