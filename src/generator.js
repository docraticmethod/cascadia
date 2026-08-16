import { readDoc, readAllTemplates } from './docs.js';
import { generate } from './anthropic.js';
import { writeFileSync } from 'node:fs';

const ADD_INSTRUCTION = 'The architect is ADDING new content. Return the COMPLETE updated downstream document (existing content plus new additions).';
const EDIT_INSTRUCTION = 'The architect is EDITING existing content. Return the COMPLETE revised downstream document.';

export async function generateStrategy({ action, payload }) {
  const requirements = readDoc('REQUIREMENTS.md');
  const existingStrategy = readDoc('STRATEGY.md');
  const system = `You are a strategic planning assistant. Generate STRATEGY.md for a software project based on its REQUIREMENTS.md.\n${action === 'add' ? ADD_INSTRUCTION : EDIT_INSTRUCTION}\nReturn only the markdown content.`;
  const user = `REQUIREMENTS.md:\n${requirements}\n\n${action === 'add' ? `New content added:\n${payload}\n\n` : ''}Existing STRATEGY.md:\n${existingStrategy || '(empty)'}`;
  return generate({ system, user });
}

export async function generateArchitecture({ action, payload }) {
  const strategy = readDoc('STRATEGY.md');
  const existingArchitecture = readDoc('ARCHITECTURE.md');
  const templates = readAllTemplates();
  let system = `You are a software architect. Generate ARCHITECTURE.md based on its STRATEGY.md and the provided architecture templates.\n${action === 'add' ? ADD_INSTRUCTION : EDIT_INSTRUCTION}\nReturn only the markdown content.`;
  if (templates.length) {
    system += '\n\nARCHITECTURE TEMPLATES:\n\n' +
      templates.map(t => `### ${t.name}\n${t.content}`).join('\n\n');
  }
  const user = `STRATEGY.md:\n${strategy}\n\n${action === 'add' ? `New content added:\n${payload}\n\n` : ''}Existing ARCHITECTURE.md:\n${existingArchitecture || '(empty)'}`;
  
  // DEBUG: inside generateArchitecture, before the generate() call:
  //writeFileSync('tmp/arch-prompt.txt', system + '\n\n---USER---\n\n' + user);

  return generate({ system, user });
}

export async function generateSystemInstructions({ action, payload }) {
  const strategy = readDoc('STRATEGY.md');
  const architecture = readDoc('ARCHITECTURE.md');
  const existingSystemInstructions = readDoc('SYSTEM_INSTRUCTIONS.md');
  const system = `You are a technical writer generating SYSTEM_INSTRUCTIONS.md for Claude Code.\n${action === 'add' ? ADD_INSTRUCTION : EDIT_INSTRUCTION}\nReturn only the markdown content.`;
  const user = `STRATEGY.md:\n${strategy}\n\nARCHITECTURE.md:\n${architecture}\n\n${action === 'add' ? `New content added:\n${payload}\n\n` : ''}Existing SYSTEM_INSTRUCTIONS.md:\n${existingSystemInstructions || '(empty)'}`;
  return generate({ system, user });
}

export async function generateFix(target, { flags, current_content }) {
  const UPSTREAM = {
    strategy: 'REQUIREMENTS.md',
    architecture: 'STRATEGY.md',
    system_instructions: 'ARCHITECTURE.md',
  };
  const upstreamContent = UPSTREAM[target] ? readDoc(UPSTREAM[target]) : '';
  const flagList = flags.map(f => `[${f.severity.toUpperCase()}] ${f.description}\nSuggested fix: ${f.suggested_fix}`).join('\n\n');
  const system = `You are a technical documentation editor. Revise the provided document to fix the listed inconsistency issues.\nReturn only the complete revised markdown content.`;
  const user = `${upstreamContent ? `Upstream context:\n${upstreamContent}\n\n` : ''}Document to fix:\n${current_content}\n\nIssues to address:\n${flagList}`;
  return generate({ system, user });
}
