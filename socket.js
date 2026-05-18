let stompClient = null;
let currentRoom = null;
const myId = "user_" + Math.random().toString(36).substr(2, 6);

// ============================================
// JOIN ROOM — requires auth
// ============================================
function joinRoom() {
  requireAuth(() => {
    const roomId = document.getElementById('roomInput').value.trim();
    if (!roomId) { showToast('Enter a room ID', 'error'); return; }
    connectToRoom(roomId);
  });
}

// ============================================
// GENERATE NEW ROOM — requires auth
// ============================================
function generateRoom() {
  requireAuth(() => {
    const roomId = Math.random().toString(36).substr(2, 8);
    document.getElementById('roomInput').value = roomId;
    connectToRoom(roomId);
  });
}

// ============================================
// CONNECT TO ROOM — wakes Render first
// ============================================
function connectToRoom(roomId) {
  if (stompClient) stompClient.deactivate();
  currentRoom = roomId;
  setStatus('connecting');
  showToast('Waking server...', 'success');

  fetch(`${BASE_URL}/health`)
    .then(() => {
      showToast('Server ready! Connecting...', 'success');
      setTimeout(() => startWebSocket(roomId), 1000);
    })
    .catch(() => startWebSocket(roomId));
}

// ============================================
// START WEBSOCKET — with polling fallback
// ============================================
function startWebSocket(roomId) {
  const socket = new SockJS(`${BASE_URL}/ws`, null, {
    transports: ['websocket', 'xhr-streaming', 'xhr-polling']
  });

  stompClient = new StompJs.Client({
    webSocketFactory: () => socket,
    reconnectDelay: 3000,
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 25000,

    onConnect: () => {
      setStatus('connected');
      showToast(`Joined room: ${roomId}`, 'success');

      document.getElementById('currentRoomDisplay').textContent = roomId;
      document.getElementById('roomInput').value = roomId;
      updateFileTab();

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

      // Subscribe — chat
      stompClient.subscribe(`/topic/room/${roomId}/chat`, (msg) => {
        const data = JSON.parse(msg.body);
        appendChatMessage(data);
      });

      // Announce join
      stompClient.publish({
        destination: `/app/room/${roomId}/join`,
        body: JSON.stringify({ userId: myId })
      });

      // Fetch existing room state
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

      addActivity(`You joined room ${roomId}`);
    },

    onDisconnect: () => {
      setStatus('disconnected');
      addActivity('Disconnected — reconnecting...');
    },

    onStompError: (frame) => {
      setStatus('disconnected');
      showToast('Connection error — retrying...', 'error');
      console.error('STOMP error:', frame);
    },

    onWebSocketError: (error) => {
      setStatus('disconnected');
      showToast('WebSocket error — retrying...', 'error');
      console.error('WS error:', error);
    }
  });

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
// SEND CHAT MESSAGE
// ============================================
function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg   = input.value.trim();
  if (!msg) { showToast('Type a message first', 'error'); return; }
  if (!currentRoom) { showToast('Join a room first', 'error'); return; }
  if (!stompClient || !stompClient.connected) {
    showToast('Not connected', 'error'); return;
  }

  const name = localStorage.getItem('cc_name') || myId;

  stompClient.publish({
    destination: `/app/room/${currentRoom}/chat`,
    body: JSON.stringify({ userId: myId, name, message: msg })
  });

  input.value = '';
}

// ============================================
// APPEND CHAT MESSAGE
// ============================================
function appendChatMessage(data) {
  const box  = document.getElementById('chatMessages');
  const isMe = data.userId === myId;

  const div = document.createElement('div');
  div.className = `chat-msg ${isMe ? 'chat-me' : 'chat-them'}`;
  div.innerHTML = `
    <span class="chat-name">${isMe ? 'You' : data.name}</span>
    <span class="chat-text">${data.message}</span>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  addActivity(`${isMe ? 'You' : data.name}: ${data.message}`);
}

// ============================================
// UPDATE USER LIST
// ============================================
function updateUserList(users) {
  const list   = document.getElementById('userList');
  const count  = document.getElementById('userCount');
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
    java:       'Main.java',
    python:     'main.py',
    cpp:        'main.cpp',
    typescript: 'main.ts',
    rust:       'main.rs'
  };
  document.getElementById('fileTabName').textContent = extensions[lang] || 'main.js';
}