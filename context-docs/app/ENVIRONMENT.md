# ENVIRONMENT.md

Opinionated agentic template. Includes Anthropic SDK, traces directory, eval pattern, the orchestrator/subagent/skills shape. Reuse target is "another agentic harness". 


## directories and files

CLAUDE.md

.gitignore
.env
package.json


context-docs/app/
CUSTOMER.md
DECISIONS.md
ENVIRONMENT.md
TODO.md

context-docs/template/
ARCHITECTURE_TEMPLATE.md
GUARDRAIL_SPEC.md

context-docs/workflow/
ARCHITECTURE.md
REQUIREMENTS.md
STRATEGY.md
SYSTEM_INSTRUCTIONS.md





src/
server.js
smoke-test-db.js
smoke-test-sdk.js


src/skills

public/index.html

data/
output/
traces/



## setup node

Install Node:

  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt install -y nodejs

Initialize Node on package.json

npm init

Install Node dependencies

npm install


## test db

node src/smoke-test-db.js
SQLite OK: { k: 'hello' }

## test anthropic sdk (claude ai api key)

node src/smoke-test-sdk.js
Here's one for you:

---

**Knock knock.**

Who's there?

**SQL.**

SQL who?

**SQL outside — maybe you should have indexed that before it got to production.**

---

(Because nothing haunts a Forward Deployed Engineer quite like a full table scan taking down a customer's database at 2am.) 🥁
Usage: {
  input_tokens: 38,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
  output_tokens: 81,
  service_tier: 'standard',
  inference_geo: 'global'
}

## test web server 

node src/server.js

console: listening on port 3000 [DEVELOPMENT]

http://localhost:3000/health
	
status	"ok"
uptime	19.484207757
version	"1.0.0"

http://localhost:3000/

HELLO WORLD 

