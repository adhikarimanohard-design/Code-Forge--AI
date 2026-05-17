const BASE_URL="https://codecollab-v9om.onrender.com";


// ============================================
// CUSTOM CURSOR
// ============================================
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

function animateTrail() {
  const cx = parseFloat(cursor.style.left) || 0;
  const cy = parseFloat(cursor.style.top)  || 0;
  trailX += (cx - trailX) * 0.15;
  trailY += (cy - trailY) * 0.15;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();

// ============================================
// ON LOAD — skip auth, go straight to app
// ============================================
window.onload = () => {
  const token = localStorage.getItem("cc_token");
  const name  = localStorage.getItem("cc_name");

  // Always show app first
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display  = 'flex';

  if (token && name) {
    updateUserDisplay(name);
  } else {
    updateUserDisplay('Guest');
  }
};

// ============================================
// REQUIRE AUTH BEFORE ACTION
// ============================================
function requireAuth(callback) {
  const token = localStorage.getItem("cc_token");
  if (token) {
    callback();
  } else {
    showAuthModal();
    window._pendingAction = callback;
  }
}

// ============================================
// AUTH MODAL
// ============================================
function showAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
}

function hideAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

// ============================================
// TAB SWITCH
// ============================================
function switchTab(tab) {
  const indicator = document.getElementById('tabIndicator');
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
  indicator.classList.toggle('right', tab === 'register');
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'flex' : 'none';
}

// ============================================
// REGISTER
// ============================================
async function register() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const errEl    = document.getElementById('registerError');

  if (!name || !email || !password) {
    errEl.textContent = "All fields required"; return;
  }

  try {
    const res  = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) { errEl.textContent = data.message || "Registration failed"; return; }

    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_name',  data.name);
    updateUserDisplay(data.name);
    hideAuthModal();
    showToast('Account created!', 'success');

    if (window._pendingAction) {
      window._pendingAction();
      window._pendingAction = null;
    }

  } catch (e) {
    errEl.textContent = "Server error. Try again.";
  }
}

// ============================================
// LOGIN
// ============================================
async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errEl    = document.getElementById('loginError');

  if (!email || !password) {
    errEl.textContent = "All fields required"; return;
  }

  try {
    const res  = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) { errEl.textContent = data.message || "Invalid credentials"; return; }

    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_name',  data.name);
    updateUserDisplay(data.name);
    hideAuthModal();
    showToast('Welcome back, ' + data.name + '!', 'success');

    if (window._pendingAction) {
      window._pendingAction();
      window._pendingAction = null;
    }

  } catch (e) {
    errEl.textContent = "Server error. Try again.";
  }
}

// ============================================
// UPDATE USER DISPLAY
// ============================================
function updateUserDisplay(name) {
  document.getElementById('loggedInUser').textContent = name;
  document.getElementById('userAvatar').textContent   = name.charAt(0).toUpperCase();
}

// ============================================
// LOGOUT
// ============================================
function logout() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_name');
  updateUserDisplay('Guest');
  showToast('Logged out', 'success');
}

// ============================================
// AUTH HEADERS
// ============================================
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('cc_token')
  };
}

// ============================================
// TOAST
// ============================================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// PANEL TOGGLE
// ============================================
function togglePanel(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

// ============================================
// COPY ROOM ID
// ============================================
function copyRoomId() {
  const roomId = document.getElementById('roomInput').value;
  if (!roomId) { showToast('No room joined yet', 'error'); return; }
  navigator.clipboard.writeText(roomId);
  showToast('Room ID copied!', 'success');
}

// ============================================
// COPY CODE
// ============================================
function copyCode() {
  if (typeof editor !== 'undefined') {
    navigator.clipboard.writeText(editor.getValue());
    showToast('Code copied!', 'success');
  }
}

// ============================================
// CLEAR CODE
// ============================================
function clearCode() {
  if (typeof editor !== 'undefined') {
    editor.setValue('');
    showToast('Editor cleared', 'success');
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') runCode();
  if (e.ctrlKey && e.shiftKey && e.key === 'E') explainCode();
  if (e.key === 'Escape') hideAuthModal();
});