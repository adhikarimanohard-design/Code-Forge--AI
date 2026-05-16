let stompClient = null;
let currentRoom = null;
const myId = "user_" + Math.random().toString(36).substr(2, 6);

// ============================================
// JOIN ROOM
// ============================================
function joinRoom() {
  const roomId = document.getElementById('roomInput').value.trim();
  if (!roomId) { showToast('Enter a room ID', 'error'); return; }
  connectToRoom(roomId);
}

// ============================================
// GENERATE NEW ROOM
// ============================================
function generateRoom() {
  const roomId = Math.random().toString(36).substr(2, 8);
  document.getElementById('roomInput').value = roomId;
  connectToRoom(roomId);
}

// ============================================
// CONNECT TO ROOM
// ============================================
function connectToRoom(roomId) {
  if (stompClient) stompClient.deactivate();
  currentRoom = roomId;

  setStatus('connecting');

  const socket = new SockJS(`${BASE_URL}/ws`);
  stompClient = new StompJs.Client({ webSocketFactory: () => socket });

  stompClient.onConnect = () => {
    setStatus('connected');
    showToast(`Joined room: ${roomId}`, 'success');

    // Update room info panel
    document.getElementById('currentRoomDisplay').textContent = roomId;
    updateFileTab();

    // Fetch existing room code
    fetch(`${BASE_URL}/api/room/${roomId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(room => {
        if (room.currentCode && editor) {
          editor.setValue(room.currentCode);
        }
        if (room.language) {
          document.getElementById('langSelect').value = room.language;
          changeLanguage();
        }
      }).catch(() => {});

    // Subscribe — code updates
    stompClient.subscribe(`/topic/room/${roomId}/code`, (msg) => {
      const data = JSON.parse(msg.body);
      if (data.userId !== myId && editor) {
        const pos = editor.getPosition();
        editor.setValue(data.code);
        editor.setPosition(pos);
        flashSync();
      }
    });

    // Subscribe — user list
    stompClient.subscribe(`/topic/room/${roomId}/users`, (msg) => {
      updateUserList(JSON.parse(msg.body));
    });

    // Announce join
    stompClient.publish({
      destination: `/app/room/${roomId}/join`,
      body: JSON.stringify({ userId: myId })
    });

    addActivity(`You joined room ${roomId}`);
  };

  stompClient.onDisconnect = () => {
    setStatus('disconnected');
    addActivity('Disconnected from room');
  };

  stompClient.onStompError = () => {
    setStatus('disconnected');
    showToast('Connection failed', 'error');
  };

  stompClient.activate();
}

// ============================================
// SEND CODE UPDATE
// ============================================
function sendCodeUpdate(code) {
  if (!stompClient || !currentRoom || !stompClient.connected) return;
  stompClient.publish({
    destination: `/app/room/${currentRoom}/code`,
    body: JSON.stringify({ code, userId: myId })
  });
  document.getElementById('syncIndicator').textContent = '● Synced';
}

// ============================================
// UPDATE USER LIST
// ============================================
function updateUserList(users) {
  const list  = document.getElementById('userList');
  const count = document.getElementById('userCount');
  const pcount = document.getElementById('participantCount');

  list.innerHTML = users.map(u =>
    `<li>${u === myId ? u + ' (you)' : u}</li>`
  ).join('');

  count.textContent  = users.length;
  pcount.textContent = users.length;
}

// ============================================
// STATUS
// ============================================
function setStatus(state) {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  dot.className = 'status-dot';
  if (state === 'connected') {
    dot.classList.add('connected');
    text.textContent = 'Connected';
  } else if (state === 'connecting') {
    text.textContent = 'Connecting...';
  } else {
    text.textContent = 'Disconnected';
  }
}

// ============================================
// ACTIVITY LOG
// ============================================
function addActivity(msg) {
  const log  = document.getElementById('activityLog');
  const item = document.createElement('div');
  item.className   = 'activity-item';
  item.textContent = msg;
  log.prepend(item);
  if (log.children.length > 10) log.removeChild(log.lastChild);
}

// ============================================
// SYNC FLASH
// ============================================
function flashSync() {
  const indicator = document.getElementById('syncIndicator');
  indicator.textContent = '↓ Receiving';
  setTimeout(() => indicator.textContent = '● Synced', 800);
}

// ============================================
// FILE TAB NAME
// ============================================
function updateFileTab() {
  const lang = document.getElementById('langSelect').value;
  const extensions = {
    javascript: 'main.js',
    java: 'Main.java',
    python: 'main.py',
    cpp: 'main.cpp',
    typescript: 'main.ts',
    rust: 'main.rs'
  };
  document.getElementById('fileTabName').textContent = extensions[lang] || 'main.js';
}