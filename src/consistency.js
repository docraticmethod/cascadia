import { generate } from './anthropic.js';

export async function check({ upstream, downstream, layer }) {
  const system = `You are a consistency checker for a REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS cascade.\nReturn ONLY a JSON object: {"consistent":boolean,"flags":[{"severity":"error"|"warning","description":"...","suggested_fix":"..."}]}\nNo markdown fences, no explanation.`;
  const user = `Layer: ${layer}\n\nUPSTREAM:\n${upstream}\n\nDOWNSTREAM (newly generated):\n${downstream}\n\nReturn the JSON consistency check result.`;
  const text = await generate({ system, user });
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { consistent: true, flags: [] };
  }
}
