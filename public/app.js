const TABS = ['requirements', 'strategy', 'architecture', 'system_instructions'];
const DOC_NAMES = {
  requirements: 'REQUIREMENTS.md',
  strategy: 'STRATEGY.md',
  architecture: 'ARCHITECTURE.md',
  system_instructions: 'SYSTEM_INSTRUCTIONS.md',
};
const TAB_LABELS = {
  requirements: 'Requirements',
  strategy: 'Strategy',
  architecture: 'Architecture',
  system_instructions: 'System Instructions',
};
const NEXT_TAB = {
  requirements: 'strategy',
  strategy: 'architecture',
  architecture: 'system_instructions',
};
const GENERATE_TARGET = {
  requirements: 'strategy',
  strategy: 'architecture',
  architecture: 'system_instructions',
};
const GENERATE_LABEL = {
  requirements: 'GENERATE STRATEGY',
  strategy: 'GENERATE ARCHITECTURE',
  architecture: 'GENERATE SYSTEM INSTRUCTIONS',
};

const state = {};
for (const tab of TABS) {
  state[tab] = { mode: 'viewing', action: null, content: '', flags: [], loaded: false, fixApplied: false };
}

let activeTab = 'requirements';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildUI() {
  const nav = document.getElementById('nav');
  const main = document.getElementById('main');

  nav.innerHTML = TABS.map(tab => `
    <button class="nav-btn" id="nav-${tab}" onclick="switchTab('${tab}')">${TAB_LABELS[tab]}</button>
  `).join('');

  main.innerHTML = TABS.map(tab => `
    <section class="tab-panel" id="panel-${tab}">
      <div class="flags" id="flags-${tab}"></div>
      <div class="controls">
        <button id="btn-add-${tab}" class="btn" onclick="onAdd('${tab}')" disabled>ADD</button>
        <button id="btn-edit-${tab}" class="btn" onclick="onEdit('${tab}')" disabled>EDIT</button>
        ${GENERATE_LABEL[tab] ? `<button id="btn-generate-${tab}" class="btn btn-primary" onclick="onGenerate('${tab}')" disabled>${GENERATE_LABEL[tab]}</button>` : ''}
      </div>
      <div id="doc-view-${tab}" class="doc-view"><span class="placeholder">Loading…</span></div>
      <textarea id="textarea-${tab}" class="doc-textarea" style="display:none" oninput="onContentInput('${tab}')"></textarea>
      <div id="spinner-${tab}" class="spinner" data-msg="" style="display:none"></div>
    </section>
  `).join('');
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`nav-${tab}`).classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tab}`).classList.add('active');
  if (!state[tab].loaded) {
    fetchDoc(tab);
  } else {
    renderView(tab);
    renderFlags(tab);
    updateUI(tab);
  }
}

async function fetchDoc(tab) {
  const res = await fetch(`/api/doc/${DOC_NAMES[tab]}`);
  const data = await res.json();
  state[tab].content = data.content || '';
  state[tab].loaded = true;
  renderView(tab);
  renderFlags(tab);
  updateUI(tab);
}

function renderView(tab) {
  const view = document.getElementById(`doc-view-${tab}`);
  if (!state[tab].content) {
    view.innerHTML = '<span class="placeholder">(empty — use ADD to start)</span>';
  } else {
    view.innerHTML = `<pre>${esc(state[tab].content)}</pre>`;
  }
}

function renderFlags(tab) {
  const container = document.getElementById(`flags-${tab}`);
  const s = state[tab];
  if (!s.flags.length) { container.innerHTML = ''; return; }
  const rows = s.flags.map(f => `
    <div class="flag ${s.fixApplied ? 'flag-resolved' : 'flag-' + f.severity}">
      <span class="flag-severity">${s.fixApplied ? '[FIXED]' : '[' + f.severity.toUpperCase() + ']'}</span>
      <span class="flag-desc">${esc(f.description)}</span>
      <span class="flag-fix-hint">${esc(f.suggested_fix)}</span>
    </div>
  `).join('');
  const fixBtn = s.fixApplied
    ? `<button class="btn btn-fixed" disabled>FIXED ALL</button>`
    : `<button class="btn btn-danger" onclick="onFix('${tab}')">FIX ALL</button>`;
  container.innerHTML = rows + fixBtn;
}

function effectiveContent(tab) {
  const s = state[tab];
  if (s.mode === 'editing') {
    return document.getElementById(`textarea-${tab}`).value;
  }
  return s.content;
}

function onContentInput(tab) {
  if (state[tab].mode === 'editing') updateUI(tab);
}

function updateUI(tab) {
  const s = state[tab];
  const btnAdd = document.getElementById(`btn-add-${tab}`);
  const btnEdit = document.getElementById(`btn-edit-${tab}`);
  const btnGenerate = document.getElementById(`btn-generate-${tab}`);
  const textarea = document.getElementById(`textarea-${tab}`);
  const view = document.getElementById(`doc-view-${tab}`);
  const hasContent = effectiveContent(tab).trim().length > 0;

  if (s.mode === 'submitting') {
    btnAdd.disabled = true;
    btnEdit.disabled = true;
    if (btnGenerate) btnGenerate.disabled = true;
    textarea.style.display = 'none';
    view.style.display = '';
  } else if (s.mode === 'editing') {
    btnAdd.disabled = true;
    btnEdit.disabled = true;
    if (btnGenerate) btnGenerate.disabled = !hasContent;
    textarea.readOnly = false;
    textarea.style.display = '';
    view.style.display = 'none';
  } else {
    btnAdd.disabled = false;
    btnEdit.disabled = !s.content;
    if (btnGenerate) btnGenerate.disabled = !hasContent;
    textarea.style.display = 'none';
    view.style.display = '';
  }
}

function onAdd(tab) {
  const s = state[tab];
  s.mode = 'editing';
  s.action = 'add';
  const textarea = document.getElementById(`textarea-${tab}`);
  textarea.value = '';
  textarea.readOnly = false;
  textarea.style.display = '';
  document.getElementById(`doc-view-${tab}`).style.display = 'none';
  updateUI(tab);
}

function onEdit(tab) {
  const s = state[tab];
  s.mode = 'editing';
  s.action = 'edit';
  const textarea = document.getElementById(`textarea-${tab}`);
  textarea.value = s.content;
  textarea.readOnly = false;
  textarea.style.display = '';
  document.getElementById(`doc-view-${tab}`).style.display = 'none';
  updateUI(tab);
}

async function onGenerate(tab) {
  const s = state[tab];
  const textarea = document.getElementById(`textarea-${tab}`);
  const editing = s.mode === 'editing';

  if (!s.action) s.action = 'edit';

  let newContent;
  if (editing && s.action === 'add') {
    const payload = textarea.value;
    newContent = s.content ? `${s.content}\n\n${payload}` : payload;
    s.pendingPayload = payload;
  } else if (editing) {
    newContent = textarea.value;
    s.pendingPayload = newContent;
  } else {
    newContent = s.content;
    s.pendingPayload = newContent;
  }

  s.mode = 'submitting';
  updateUI(tab);

  const spinner = document.getElementById(`spinner-${tab}`);
  spinner.dataset.msg = 'SAVING…';
  spinner.style.display = '';

  try {
    await fetch(`/api/doc/${DOC_NAMES[tab]}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });
    s.content = newContent;

    const next = NEXT_TAB[tab];
    if (!next) {
      s.mode = 'viewing';
      s.action = null;
      s.flags = [];
      renderView(tab);
      renderFlags(tab);
      updateUI(tab);
      spinner.style.display = 'none';
      return;
    }

    const target = GENERATE_TARGET[tab];
    spinner.dataset.msg = `AI GENERATING ${TAB_LABELS[next].toUpperCase()}…`;

    const genRes = await fetch(`/api/generate/${target}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: s.action, payload: s.pendingPayload }),
    });
    const genData = await genRes.json();

    await fetch(`/api/doc/${DOC_NAMES[next]}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: genData.generated_content }),
    });

    s.mode = 'viewing';
    s.action = null;
    s.flags = [];
    state[next].content = genData.generated_content;
    state[next].flags = genData.flags || [];
    state[next].fixApplied = false;
    state[next].loaded = true;
    state[next].mode = 'viewing';

    spinner.style.display = 'none';
    switchTab(next);
  } catch (err) {
    spinner.style.display = 'none';
    s.mode = 'viewing';
    updateUI(tab);
    console.error('Submit failed:', err);
  }
}

async function onFix(tab) {
  const s = state[tab];
  const spinner = document.getElementById(`spinner-${tab}`);
  spinner.dataset.msg = 'AI FIXING…';
  spinner.style.display = '';

  try {
    const res = await fetch(`/api/fix/${tab}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flags: s.flags, current_content: s.content }),
    });
    const data = await res.json();

    s.content = data.revised_content;
    s.fixApplied = true;
    s.mode = 'editing';
    s.action = 'edit';

    const textarea = document.getElementById(`textarea-${tab}`);
    textarea.value = data.revised_content;

    spinner.style.display = 'none';
    renderFlags(tab);
    updateUI(tab);
  } catch (err) {
    spinner.style.display = 'none';
    console.error('Fix failed:', err);
  }
}

buildUI();
switchTab('requirements');
