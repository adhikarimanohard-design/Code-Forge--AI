// ============================================
// AI EXPLAIN
// ============================================
async function explainCode() {
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
// RUN CODE (Piston API — no backend needed)
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

  // Language version map for Piston
  const langMap = {
    javascript: { language: 'javascript', version: '18.15.0' },
    java:       { language: 'java',       version: '15.0.2'  },
    python:     { language: 'python',     version: '3.10.0'  },
    cpp:        { language: 'c++',        version: '10.2.0'  },
    typescript: { language: 'typescript', version: '5.0.3'   },
    rust:       { language: 'rust',       version: '1.68.2'  },
  };

  const config = langMap[lang] || { language: lang, version: '*' };

  try {
    const res  = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.language,
        version:  config.version,
        files: [{ content: code }]
      })
    });

    const data = await res.json();

    if (data.run) {
      const out = data.run.stdout || data.run.stderr || '(no output)';
      output.textContent = '~ ' + out;
      addActivity('Code executed');
    } else {
      output.textContent = '~ Error: ' + JSON.stringify(data);
    }

  } catch (e) {
    output.textContent = '~ Error: ' + e.message;
  }
}