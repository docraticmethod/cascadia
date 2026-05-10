import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const res = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 200,
  messages: [{
    role: 'user',
    content: 'Tell me a knock-knock joke. Play both parts. Make the punchline a pun on something a Forward Deployed Engineer would care about.'
  }],
});

console.log(res.content[0].text);
console.log('Usage:', res.usage);