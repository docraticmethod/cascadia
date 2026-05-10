import 'dotenv/config';
import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const PUBLIC_DIR = join(__dirname, '..', 'public');

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: pkg.version,
  });
});



if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  requireEnv('ANTHROPIC_API_KEY');
  const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development';
  const PORT = Number(process.env.PORT) || 3000;

  const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT} [${ENVIRONMENT}]`);
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT',  () => server.close(() => process.exit(0)));
}

export default app;