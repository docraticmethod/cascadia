import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readDoc, writeDoc, ALLOWED_DOCS } from './docs.js';
import { generateStrategy, generateArchitecture, generateSystemInstructions, generateFix } from './generator.js';
import { check } from './consistency.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const PUBLIC_DIR = join(__dirname, '..', 'public');

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing required env var: ${name}`); process.exit(1); }
  return v;
}

const GENERATORS = {
  strategy: generateStrategy,
  architecture: generateArchitecture,
  system_instructions: generateSystemInstructions,
};

const UPSTREAM_DOCS = {
  strategy: 'REQUIREMENTS.md',
  architecture: 'STRATEGY.md',
  system_instructions: 'ARCHITECTURE.md',
};

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: pkg.version });
});

app.get('/api/doc/:name', (req, res) => {
  const { name } = req.params;
  if (!ALLOWED_DOCS.has(name)) return res.status(400).json({ error: 'Invalid document name' });
  res.json({ content: readDoc(name) });
});

app.put('/api/doc/:name', (req, res) => {
  const { name } = req.params;
  if (!ALLOWED_DOCS.has(name)) return res.status(400).json({ error: 'Invalid document name' });
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'body.content must be a string' });
  writeDoc(name, content);
  res.json({ ok: true });
});

app.post('/api/generate/:target', async (req, res) => {
  const { target } = req.params;
  const generator = GENERATORS[target];
  if (!generator) return res.status(400).json({ error: 'Invalid generation target' });
  const { action, payload } = req.body;
  if (!['add', 'edit'].includes(action)) return res.status(400).json({ error: 'action must be add or edit' });
  const generated_content = await generator({ action, payload });
  const upstream = readDoc(UPSTREAM_DOCS[target]);
  const consistency = await check({ upstream, downstream: generated_content, layer: target });
  res.json({ generated_content, flags: consistency.flags });
});

app.post('/api/fix/:target', async (req, res) => {
  const { target } = req.params;
  if (!GENERATORS[target]) return res.status(400).json({ error: 'Invalid fix target' });
  const { flags, current_content } = req.body;
  if (!Array.isArray(flags) || typeof current_content !== 'string')
    return res.status(400).json({ error: 'flags must be array and current_content must be string' });
  const revised_content = await generateFix(target, { flags, current_content });
  res.json({ revised_content });
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  requireEnv('ANTHROPIC_API_KEY');
  requireEnv('ANTHROPIC_MODEL');
  const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development';
  const PORT = Number(process.env.PORT) || 3000;
  const server = app.listen(PORT, () => { console.log(`listening on port ${PORT} [${ENVIRONMENT}]`); });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT',  () => server.close(() => process.exit(0)));
}

export default app;
