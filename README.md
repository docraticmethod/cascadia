# Cascadia Console

**Author:** Blake Rogers

**Email:** saltyfog@gmail.com

**LinkedIn:** https://www.linkedin.com/in/blakerogerz/

A Node/Express tool that turns plain-English requirements into a complete system-instructions document Claude Code can execute without further prompting. Input requirements and Submit; Cascadia drafts a strategy, flags inconsistencies, and fixes them with one click. Strategy compiles into architecture via swappable templates, flags and fixes issues, then outputs system instructions into your target project. Edit any layer in the Console and everything downstream regenerates. Hand the system instructions to Claude Code and it builds the app.

## Quick start after cloning this repo

1. Copy `/TARGET/context-docs/` from the console project into your target project root so workflow lives at `<project>/context-docs/workflow/`.
2. Pick a template from `/TARGET/template-library/` and drop it in your target project at `<project>/context-docs/template/`.
3. Create `.env`:
```
TARGET_WORKFLOW=/absolute/path/to/<project>/context-docs/workflow 
TARGET_TEMPLATE=/absolute/path/to/<project>/context-docs/template 
ANTHROPIC_API_KEY=sk-... 
ANTHROPIC_MODEL=claude-opus-4-7 
PORT=3001
```
4. `npm install && node src/server.js`
5. Open Cascadia Console at `http://localhost:3001`

Note: The Unlock checkbox enables Edit/Add and disables Submit. The Lock checkbox disables Edit/Add and enables Submit. 

## License
Apache 2.0
