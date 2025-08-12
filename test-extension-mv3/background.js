// Background script - JSON Benchmark
console.log('Background started');

// Listen for port connections from popup
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);

  if (port.name === 'popup-port') {
    // Send a welcome message when popup connects
    port.postMessage({
      type: 'welcome',
      message: 'Hello from the background service worker! 🚀 JSON Benchmark Ready',
      timestamp: new Date().toISOString()
    });

    // Listen for messages from popup
    port.onMessage.addListener((message) => {
      // Handle JSON.stringify messages (string format)
      if (typeof message === 'string') {
        const sigilIndex = message.indexOf('|');
        let messageId = 'unknown';

        if (sigilIndex > 0) {
          messageId = message.substring(0, sigilIndex);
          const jsonString = message.substring(sigilIndex + 1);

          try {
            // Parse the JSON to verify it's valid and add processing time
            const parsedData = JSON.parse(jsonString);
            console.log(`Received JSON.stringify: ${message.length} characters, ID: ${messageId}, parsed ${Object.keys(parsedData).length} top-level keys`);
          } catch (error) {
            console.error(`Failed to parse JSON.stringify message: ${error.message}`);
          }
        }

        // Echo back the JSON.stringify message
        port.postMessage(message);

      } else if (message && typeof message === 'object') {
        // Handle direct JSON messages
        if (message.type === 'json_benchmark' && message.messageId) {
          const messageId = message.messageId;
          const dataKeys = message.data ? Object.keys(message.data).length : 0;

          console.log(`Received Direct JSON: ID ${messageId}, data has ${dataKeys} top-level keys`);

          // Echo back the direct JSON message
          port.postMessage(message);

        } else if (message.type === 'json_benchmark_dfs' && message.messageId) {
          const messageId = message.messageId;
          const dataKeys = message.data ? Object.keys(message.data).length : 0;
          const dfsLength = message.dfsLength || 0;
          const dfsTime = message.dfsTime || 0;
          console.log("DFS length", countJsonStringifyLength(message));

          console.log(`Received Direct JSON + DFS: ID ${messageId}, data has ${dataKeys} top-level keys, DFS counted ${dfsLength} chars in ${dfsTime.toFixed(2)}ms`);

          // Echo back the direct JSON + DFS message
          port.postMessage(message);

        } else if (message.type === 'welcome') {
          // Skip welcome message echo
          return;

        } else {
          // Handle other JSON messages for backward compatibility
          console.log('Received other JSON message:', {
            type: message.type || 'unknown',
            keys: Object.keys(message).length,
            messageId: message.messageId || 'none'
          });

          // Echo back the message
          port.postMessage(message);
        }
      } else {
        console.log('Received unknown message type:', typeof message, message);
      }
    });

    // Handle port disconnect
    port.onDisconnect.addListener(() => {
      console.log('Popup port disconnected');
    });
  }
});

console.log('Background service worker setup complete');


// DFS function to count characters as if JSON.stringify was called
function countJsonStringifyLength(obj, seen = new Set()) {
  // Handle circular references
  if (obj !== null && typeof obj === 'object') {
    if (seen.has(obj)) {
      return 4; // "null" - circular reference becomes null
    }
    seen.add(obj);
  }

  try {
    if (obj === null) {
      return 4; // "null"
    }

    if (obj === undefined) {
      return 0; // undefined is omitted in JSON.stringify
    }

    if (typeof obj === 'boolean') {
      return obj ? 4 : 5; // "true" or "false"
    }

    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        return 4; // "null" for NaN and Infinity
      }
      return String(obj).length;
    }

    if (typeof obj === 'string') {
      // Account for quotes and escaped characters
      let length = 2; // opening and closing quotes
      for (let i = 0; i < obj.length; i++) {
        const char = obj[i];
        switch (char) {
          case '"':
          case '\\':
          case '\b':
          case '\f':
          case '\n':
          case '\r':
          case '\t':
            length += 2; // escaped character (\")
            break;
          default:
            if (char.charCodeAt(0) < 32) {
              length += 6; // unicode escape (\u0000)
            } else {
              length += 1;
            }
        }
      }
      return length;
    }

    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return 0; // functions and symbols are omitted
    }

    if (Array.isArray(obj)) {
      let length = 2; // [ and ]
      for (let i = 0; i < obj.length; i++) {
        if (i > 0) length += 1; // comma separator
        length += countJsonStringifyLength(obj[i], seen);
      }
      return length;
    }

    if (typeof obj === 'object') {
      let length = 2; // { and }
      let hasProps = false;

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined && typeof value !== 'function' && typeof value !== 'symbol') {
            if (hasProps) length += 1; // comma separator
            length += countJsonStringifyLength(key, seen); // key
            length += 1; // colon
            length += countJsonStringifyLength(value, seen); // value
            hasProps = true;
          }
        }
      }

      return length;
    }

    return 0;
  } finally {
    // Clean up the seen set for this object
    if (obj !== null && typeof obj === 'object') {
      seen.delete(obj);
    }
  }
}