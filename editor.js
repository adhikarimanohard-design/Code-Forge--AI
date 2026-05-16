let editor;

require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
});

require(['vs/editor/editor.main'], function () {

  // Define custom theme — matches CodeCollab design
  monaco.editor.defineTheme('codecollab', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',    foreground: '444466', fontStyle: 'italic' },
      { token: 'keyword',    foreground: '7fffb2', fontStyle: 'bold' },
      { token: 'string',     foreground: 'ffd166' },
      { token: 'number',     foreground: '00e5ff' },
      { token: 'type',       foreground: 'ff6af0' },
      { token: 'function',   foreground: '7fffb2' },
      { token: 'variable',   foreground: 'e8e8f0' },
      { token: 'operator',   foreground: '00e5ff' },
    ],
    colors: {
      'editor.background':           '#080810',
      'editor.foreground':           '#e8e8f0',
      'editorLineNumber.foreground': '#333355',
      'editorLineNumber.activeForeground': '#7fffb2',
      'editor.lineHighlightBackground': '#0d0d1a',
      'editor.selectionBackground':  '#7fffb220',
      'editor.inactiveSelectionBackground': '#7fffb210',
      'editorCursor.foreground':     '#7fffb2',
      'editorWhitespace.foreground': '#1a1a2e',
      'editorIndentGuide.background': '#1a1a2e',
      'editorIndentGuide.activeBackground': '#333355',
      'editor.findMatchBackground':  '#7fffb230',
      'editorBracketMatch.background': '#7fffb215',
      'editorBracketMatch.border':   '#7fffb2',
      'scrollbarSlider.background':  '#ffffff10',
      'scrollbarSlider.hoverBackground': '#ffffff20',
      'editorSuggestWidget.background': '#0d0d1a',
      'editorSuggestWidget.border':  '#222233',
      'editorSuggestWidget.selectedBackground': '#7fffb220',
    }
  });

  editor = monaco.editor.create(
    document.getElementById('editor-container'), {
      value: `// Welcome to CodeCollab ⚡
// Join a room and start coding together in real-time

function greet(name) {
  return \`Hello, \${name}! Let's build something amazing.\`;
}

console.log(greet("World"));`,
      language: 'javascript',
      theme: 'codecollab',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      fontLigatures: true,
      lineHeight: 22,
      letterSpacing: 0.5,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      smoothScrolling: true,
      cursorBlinking: 'phase',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'line',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      suggest: { showKeywords: true },
      wordWrap: 'on',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      renderWhitespace: 'none',
      occurrencesHighlight: true,
      selectionHighlight: true,
    }
  );

  // Update statusbar on cursor move
  editor.onDidChangeCursorPosition((e) => {
    document.getElementById('cursorPos').textContent =
      `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });

  // Update char count + debounced sync
  let debounceTimer;
  editor.onDidChangeModelContent(() => {
    const code = editor.getValue();
    document.getElementById('charCount').textContent = code.length + ' chars';
    document.getElementById('syncIndicator').textContent = '↑ Syncing...';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      sendCodeUpdate(code);
    }, 300);
  });

  // Resize observer
  const resizeObserver = new ResizeObserver(() => editor.layout());
  resizeObserver.observe(document.getElementById('editor-container'));
});

// ============================================
// CHANGE LANGUAGE
// ============================================
function changeLanguage() {
  const lang = document.getElementById('langSelect').value;

  if (typeof editor !== 'undefined' && editor) {
    monaco.editor.setModelLanguage(editor.getModel(), lang);
  }

  // Update displays
  const langNames = {
    javascript: 'JavaScript',
    java: 'Java',
    python: 'Python',
    cpp: 'C++',
    typescript: 'TypeScript',
    rust: 'Rust'
  };

  document.getElementById('langBadge').textContent         = langNames[lang] || lang;
  document.getElementById('currentLangDisplay').textContent = langNames[lang] || lang;
  updateFileTab();
}