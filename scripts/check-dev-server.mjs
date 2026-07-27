import { createServer } from 'vite';

const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  logLevel: 'warn'
});

let exitCode = 0;

try {
  await server.listen();
  const response = await fetch('http://127.0.0.1:5173/');
  const html = await response.text();
  if (!response.ok || !html.includes('id="root"')) {
    throw new Error(`Development server smoke check failed with HTTP ${response.status}.`);
  }

  const noteMessage = `Local notes integration check ${Date.now()}`;
  const createResponse = await fetch('http://127.0.0.1:5173/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anonymous: true,
      name: '',
      message: noteMessage,
      website: ''
    })
  });
  const created = await createResponse.json();
  if (!createResponse.ok || !created.note?.id) {
    throw new Error(`Guest notes creation check failed with HTTP ${createResponse.status}.`);
  }

  const notesResponse = await fetch('http://127.0.0.1:5173/api/notes');
  const notes = await notesResponse.json();
  if (!notesResponse.ok || !notes.notes?.some((note) => note.id === created.note.id)) {
    throw new Error(`Guest notes reading check failed with HTTP ${notesResponse.status}.`);
  }

  console.log('Development site and persistent guest notes API responded successfully at http://127.0.0.1:5173/');
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  await Promise.race([
    server.close(),
    new Promise((resolve) => {
      const timer = setTimeout(resolve, 3_000);
      timer.unref();
    })
  ]);
}

process.exit(exitCode);
