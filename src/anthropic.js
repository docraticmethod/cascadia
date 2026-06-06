import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL;

if (!ANTHROPIC_API_KEY) { console.error('Missing required env var: ANTHROPIC_API_KEY'); process.exit(1); }
if (!ANTHROPIC_MODEL) { console.error('Missing required env var: ANTHROPIC_MODEL'); process.exit(1); }

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function generate({ system, user }) {
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 16384,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });
  return message.content[0].text;
}
