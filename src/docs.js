import { readFileSync, writeFileSync, renameSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ALLOWED_DOCS = new Set(['REQUIREMENTS.md', 'STRATEGY.md', 'ARCHITECTURE.md', 'SYSTEM_INSTRUCTIONS.md']);
const ALLOWED_TEMPLATES = new Set(['ARCHITECTURE_TEMPLATE.md', 'GUARDRAIL_SPEC.md']);

const TARGET_WORKFLOW = process.env.TARGET_WORKFLOW;
if (!TARGET_WORKFLOW) { console.error('Missing required env var: TARGET_WORKFLOW'); process.exit(1); }

try { statSync(TARGET_WORKFLOW); } catch {
  console.error(`TARGET_WORKFLOW not readable: ${TARGET_WORKFLOW}`); process.exit(1);
}

const TARGET_TEMPLATE = process.env.TARGET_TEMPLATE || '';
const TEMPLATE_DIR = TARGET_TEMPLATE ? resolve(TARGET_TEMPLATE) : '';

export function readDoc(name) {
  if (!ALLOWED_DOCS.has(name)) throw new Error(`Invalid doc name: ${name}`);
  try { return readFileSync(join(TARGET_WORKFLOW, name), 'utf8'); } catch { return ''; }
}

export function writeDoc(name, content) {
  if (!ALLOWED_DOCS.has(name)) throw new Error(`Invalid doc name: ${name}`);
  const dest = join(TARGET_WORKFLOW, name);
  const tmp = `${dest}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, dest);
}

export function readTemplate(name) {
  if (!ALLOWED_TEMPLATES.has(name)) throw new Error(`Invalid template name: ${name}`);
  if (!TEMPLATE_DIR) return null;
  try { return readFileSync(join(TEMPLATE_DIR, name), 'utf8'); } catch { return null; }
}

export function readAllTemplates() {
  if (!TEMPLATE_DIR) return [];
  try {
    return readdirSync(TEMPLATE_DIR)
      .filter(f => f.endsWith('.md'))
      .map(name => {
        try { return { name, content: readFileSync(join(TEMPLATE_DIR, name), 'utf8') }; }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
