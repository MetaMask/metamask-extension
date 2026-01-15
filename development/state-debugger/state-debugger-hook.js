/**
 * State Debugger Hook
 *
 * This module connects to the state debugger server and sends state updates.
 * It should only be loaded in development builds.
 */

const STATE_DEBUGGER_URL = 'ws://localhost:3333?type=extension';
const RECONNECT_INTERVAL = 2000;

let ws = null;
let reconnectTimeout = null;
let isConnected = false;
let controllerRef = null;

/**
 * Connect to the state debugger server
 */
function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    ws = new WebSocket(STATE_DEBUGGER_URL);

    ws.onopen = () => {
      console.log('[StateDebugger] Connected to debugger server');
      isConnected = true;
      // Send initial state
      sendFullState();
    };

    ws.onclose = () => {
      console.log('[StateDebugger] Disconnected from debugger server');
      isConnected = false;
      scheduleReconnect();
    };

    ws.onerror = () => {
      isConnected = false;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'requestFullState' || message.type === 'requestRefresh') {
          console.log('[StateDebugger] Full state requested');
          sendFullState();
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
  } catch (error) {
    console.log('[StateDebugger] Could not connect:', error.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = setTimeout(connect, RECONNECT_INTERVAL);
}

function send(message) {
  if (!isConnected || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.log('[StateDebugger] Failed to send:', error.message);
  }
}

function sendFullState() {
  if (!controllerRef) return;

  send({
    type: 'fullState',
    timestamp: Date.now(),
    persisted: controllerRef.store.getState(),
    memory: controllerRef.memStore.getState(),
  });
}

function sendChange(storeType, controllerKey, newState, patches) {
  // Build changed paths from patches
  const changedPaths = [];
  if (patches && patches.length > 0) {
    patches.forEach(patch => {
      const path = [controllerKey, ...patch.path].join('.');
      changedPaths.push({ path, op: patch.op, value: patch.value });
    });
  } else {
    // No patches, just mark the whole controller as changed
    changedPaths.push({ path: controllerKey, op: 'update', value: null });
  }

  send({
    type: 'stateChange',
    timestamp: Date.now(),
    storeType,
    controllerKey,
    newState,
    changedPaths,
  });
}

/**
 * Initialize the state debugger hook
 */
function initializeStateDebugger(controller) {
  if (!controller || !controller.store || !controller.memStore) {
    console.warn('[StateDebugger] Controller not properly initialized');
    return;
  }

  console.log('[StateDebugger] Initializing state debugger...');
  controllerRef = controller;

  // Connect to server
  connect();

  // Listen for persisted store changes (has patches)
  controller.store.on('stateChange', ({ controllerKey, newState, patches }) => {
    sendChange('persisted', controllerKey, newState, patches);
  });

  // Listen for memory store changes
  let previousMemState = {};
  controller.memStore.subscribe((newFullState) => {
    const allKeys = new Set([
      ...Object.keys(previousMemState),
      ...Object.keys(newFullState),
    ]);

    allKeys.forEach((key) => {
      if (previousMemState[key] !== newFullState[key]) {
        sendChange('memory', key, newFullState[key], null);
      }
    });

    previousMemState = { ...newFullState };
  });

  console.log('[StateDebugger] State debugger initialized');
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeStateDebugger };
}

globalThis.stateDebugger = {
  initializeStateDebugger,
  connect,
  refresh: sendFullState,
  isConnected: () => isConnected,
};
