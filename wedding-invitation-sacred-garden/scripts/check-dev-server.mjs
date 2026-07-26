import { createServer } from 'vite';

const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  logLevel: 'warn'
});

try {
  await server.listen();
  const response = await fetch('http://127.0.0.1:5173/');
  const html = await response.text();
  if (!response.ok || !html.includes('id="root"')) {
    throw new Error(`Development server smoke check failed with HTTP ${response.status}.`);
  }
  console.log('Development server responded successfully at http://127.0.0.1:5173/');
} finally {
  await server.close();
}
