import { spawn } from 'child_process';

console.log('Starting API Server on port 3001...');
const api = spawn('npx', ['tsx', 'server.ts'], { stdio: 'inherit', shell: true, env: { ...process.env, NODE_ENV: 'development' } });

console.log('Starting Vite Frontend on port 3000...');
const vite = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit', shell: true });

api.on('exit', (code) => {
  vite.kill();
  process.exit(code || 0);
});

vite.on('exit', (code) => {
  api.kill();
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  api.kill();
  vite.kill();
  process.exit(0);
});
