// ============================================
// AI EXPLAIN
// ============================================
async function explainCode() {
  const token = localStorage.getItem('cc_token');
  if (!token) { showAuthModal(); return; }

  const code   = editor ? editor.getValue() : '';
  const output = document.getElementById('aiOutput');

  if (!code.trim()) {
    showToast('Nothing to explain', 'error');
    return;
  }

  output.innerHTML = `
    <div class="ai-loading">
      <span></span><span></span><span></span>
    </div>`;

  try {
    const res  = await fetch(`${BASE_URL}/api/ai/explain`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code })
    });
    const text = await res.text();
    output.textContent = text;
    addActivity('AI explained code');

  } catch (e) {
    output.textContent = 'AI error: ' + e.message;
  }
}

// ============================================
// AI DEBUG
// ============================================
async function debugCode() {
  const token = localStorage.getItem('cc_token');
  if (!token) { showAuthModal(); return; }

  const code   = editor ? editor.getValue() : '';
  const output = document.getElementById('aiOutput');

  if (!code.trim()) {
    showToast('Nothing to debug', 'error');
    return;
  }

  output.innerHTML = `
    <div class="ai-loading">
      <span></span><span></span><span></span>
    </div>`;

  try {
    const res  = await fetch(`${BASE_URL}/api/ai/debug`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code })
    });
    const text = await res.text();
    output.textContent = text;
    addActivity('AI debugged code');

  } catch (e) {
    output.textContent = 'AI error: ' + e.message;
  }
}

// ============================================
// RUN CODE (Judge0 API)
// ============================================
async function runCode() {

  const code   = editor ? editor.getValue() : '';
  const lang   = document.getElementById('langSelect').value;
  const output = document.getElementById('codeOutput');

  if (!code.trim()) {
    showToast('Nothing to run', 'error');
    return;
  }

  output.textContent = '~ running...';

  // Judge0 language IDs
  const langMap = {
    javascript: 63,
    typescript: 74,
    python: 71,
    java: 62,
    cpp: 54,
    rust: 73
  };

  const language_id = langMap[lang];

  try {

    const res = await fetch(
      'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language_id: language_id,
          source_code: code
        })
      }
    );

    const data = await res.json();

    const result =
      data.stdout ||
      data.stderr ||
      data.compile_output ||
      data.message ||
      'No output';

    output.textContent = '~ ' + result;

    addActivity('Code executed');

  } catch (e) {

    output.textContent = '~ Error: ' + e.message;

  }
}