// Popup script for MV3 extension - JSON Benchmark
console.log('Popup script loaded');

// Track sent messages for duration calculation
const sentMessages = new Map();
let benchmarkResults = { jsonStringify: null, directJson: null, directJsonWithDfs: null };

// Connect to background service worker via port
const port = chrome.runtime.connect({ name: 'popup-port' });

// Listen for messages from background
port.onMessage.addListener((message) => {
  console.log('Received message from background:', message);

  const messageContainer = document.getElementById('messageContainer');
  let durationInfo = '';
  let messageId = null;
  let messageType = null;

  // Parse messages to extract message ID and type
  if (typeof message === 'string') {
    // JSON.stringify format: messageId|stringified_json_data
    const sigilIndex = message.indexOf('|');
    if (sigilIndex > 0) {
      messageId = message.substring(0, sigilIndex);
      messageType = 'JSON.stringify';
      console.log(`Parsed JSON.stringify message ID: ${messageId}, length: ${message.length}`);
    }
  } else if (message && typeof message === 'object') {
    // Direct JSON format
    if (message.type === 'json_benchmark' && message.messageId) {
      messageId = message.messageId;
      messageType = 'Direct JSON';
      console.log(`Parsed Direct JSON message ID: ${messageId}`);
    } else if (message.type === 'json_benchmark_dfs' && message.messageId) {
      messageId = message.messageId;
      messageType = 'Direct JSON + DFS';
      console.log(`Parsed Direct JSON + DFS message ID: ${messageId}`);
    } else if (message.type === 'welcome') {
      // Handle welcome messages
      messageContainer.innerHTML = `
        <div class="message">${message.message}</div>
        <div class="timestamp">Received at: ${message.timestamp}</div>
      `;
      return;
    }
  }

  // Calculate duration if this is a response to a sent message
  if (messageId && sentMessages.has(messageId)) {
    const sentTime = sentMessages.get(messageId);
    const receivedTime = performance.now();
    const duration = Math.round(receivedTime - sentTime);

    // Store the result for benchmark comparison
    const messageData = sentMessages.get(messageId + '_data');
    const promiseData = sentMessages.get(messageId + '_promise');

    if (messageData) {
      messageData.duration = duration;

      // Debug: Log detailed timing information
      console.log(`⏱️ ${messageData.type} timing:`, {
        networkDuration: duration,
        totalSize: messageData.totalSize,
        dataSize: messageData.size,
        overhead: messageData.totalSize - messageData.size,
        dfsTime: messageData.dfsTime || 'N/A',
        stringifyTime: messageData.stringifyTime || 'N/A'
      });

      // Store in benchmark results
      if (messageData.type === 'JSON.stringify') {
        benchmarkResults.jsonStringify = { duration, size: messageData.size, totalSize: messageData.totalSize };
      } else if (messageData.type === 'Direct JSON') {
        benchmarkResults.directJson = { duration, size: messageData.size, totalSize: messageData.totalSize };
      } else if (messageData.type === 'Direct JSON + DFS') {
        // Add DFS time to the duration for fair comparison
        const totalDuration = duration + (messageData.dfsTime || 0);
        console.log(`🔍 DFS calculation: network=${duration}ms + dfs=${messageData.dfsTime}ms = total=${totalDuration}ms`);
        benchmarkResults.directJsonWithDfs = {
          duration: totalDuration,
          totalDuration: totalDuration,
          size: messageData.size,
          totalSize: messageData.totalSize,
          dfsLength: messageData.dfsLength,
          networkDuration: duration,
          dfsTime: messageData.dfsTime
        };
      }

      // Resolve the promise for this specific message
      if (promiseData && promiseData.resolve) {
        promiseData.resolve({
          type: messageData.type,
          duration: messageData.type === 'Direct JSON + DFS' ? duration + (messageData.dfsTime || 0) : duration,
          size: messageData.size,
          totalSize: messageData.totalSize
        });
      }

      // Check if we have all three results to display comparison
      if (benchmarkResults.jsonStringify && benchmarkResults.directJson && benchmarkResults.directJsonWithDfs) {
        displayBenchmarkResults();
      } else {
        // Show individual result while waiting for others
        const actualSize = messageType === 'JSON.stringify' ? message.length : JSON.stringify(message).length;
        const remainingTypes = [];
        if (!benchmarkResults.jsonStringify) remainingTypes.push('JSON.stringify');
        if (!benchmarkResults.directJson) remainingTypes.push('Direct JSON');
        if (!benchmarkResults.directJsonWithDfs) remainingTypes.push('Direct JSON + DFS');

        // For DFS, show total duration (network + DFS time)
        const displayDuration = messageData.type === 'Direct JSON + DFS' ?
          duration + (messageData.dfsTime || 0) : duration;

        durationInfo = `<div class="duration" style="color: #28a745; font-weight: bold; margin-top: 5px;">✓ ${messageData.type}: ${displayDuration}ms</div>
                      <div style="color: #666; font-size: 12px;">Size: ${actualSize} chars, waiting for ${remainingTypes.join(', ')} result(s)...</div>`;

        messageContainer.innerHTML = `
          <div class="message">Received ${messageType} echo (${actualSize} chars)</div>
          <div class="timestamp">Received at: ${new Date().toISOString()}</div>
          ${durationInfo}
        `;
      }
    }

    // Clean up the sent message tracking
    sentMessages.delete(messageId);
    sentMessages.delete(messageId + '_data');
    sentMessages.delete(messageId + '_promise');

    console.log(`${messageType} round-trip took ${duration}ms`);
  } else if (!messageId) {
    // Handle unrecognized messages
    const messageStr = typeof message === 'string' ? message.substring(0, 100) + '...' :
                     JSON.stringify(message).substring(0, 100);
    messageContainer.innerHTML = `
      <div class="message">Received unrecognized message: ${messageStr}</div>
      <div class="timestamp">Received at: ${new Date().toISOString()}</div>
    `;
  }
});

function displayBenchmarkResults() {
  const messageContainer = document.getElementById('messageContainer');
  const jsonStringifyResult = benchmarkResults.jsonStringify;
  const directJsonResult = benchmarkResults.directJson;
  const directJsonWithDfsResult = benchmarkResults.directJsonWithDfs;

  // Debug logging to see what we actually have
  console.log('Benchmark Results:', {
    jsonStringify: jsonStringifyResult,
    directJson: directJsonResult,
    directJsonWithDfs: directJsonWithDfsResult
  });

  const dataKB = (jsonStringifyResult.size / 1024).toFixed(2);
  const stringifyTotalKB = (jsonStringifyResult.totalSize / 1024).toFixed(2);
  const directTotalKB = (directJsonResult.totalSize / 1024).toFixed(2);
  const directDfsTotalKB = (directJsonWithDfsResult.totalSize / 1024).toFixed(2);

  // Find the winner
  const times = [
    { name: 'JSON.stringify', duration: jsonStringifyResult.duration },
    { name: 'Direct JSON', duration: directJsonResult.duration },
    { name: 'Direct JSON + DFS', duration: directJsonWithDfsResult.totalDuration }
  ];
  times.sort((a, b) => a.duration - b.duration);
  const winner = times[0].name;
  const secondPlace = times[1].name;
  const thirdPlace = times[2].name;

  const winnerTime = times[0].duration;
  const slowestTime = times[2].duration;
  const difference = slowestTime - winnerTime;
  const percentDiff = ((difference / winnerTime) * 100).toFixed(1);

  messageContainer.innerHTML = `
    <div style="font-weight: bold; color: #333; margin-bottom: 10px;">📊 JSON Benchmark (${dataKB} KB data)</div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #007cba; font-weight: bold;">JSON.stringify:</span>
      <span style="font-weight: bold; color: ${winner === 'JSON.stringify' ? '#28a745' : '#666'};">
        ${jsonStringifyResult.duration}ms ${winner === 'JSON.stringify' ? '🥇' : times[1].name === 'JSON.stringify' ? '🥈' : '🥉'}
      </span>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #007cba; font-weight: bold;">Direct JSON:</span>
      <span style="font-weight: bold; color: ${winner === 'Direct JSON' ? '#28a745' : '#666'};">
        ${directJsonResult.duration}ms ${winner === 'Direct JSON' ? '🥇' : times[1].name === 'Direct JSON' ? '🥈' : '🥉'}
      </span>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span style="color: #007cba; font-weight: bold;">Direct JSON + DFS:</span>
      <span style="font-weight: bold; color: ${winner === 'Direct JSON + DFS' ? '#28a745' : '#666'};">
        ${directJsonWithDfsResult.totalDuration}ms ${winner === 'Direct JSON + DFS' ? '🥇' : times[1].name === 'Direct JSON + DFS' ? '🥈' : '🥉'}
      </span>
    </div>

    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid #28a745;">
      <div style="font-weight: bold; color: #28a745;">${winner} is fastest, slowest is ${difference}ms slower (${percentDiff}%)</div>
      <div style="font-size: 12px; color: #666; margin-top: 2px;">
        Throughput: Stringify=${(jsonStringifyResult.totalSize/jsonStringifyResult.duration/1000).toFixed(2)}KB/s (${stringifyTotalKB}KB),
        Direct=${(directJsonResult.totalSize/directJsonResult.duration/1000).toFixed(2)}KB/s (${directTotalKB}KB),
        DFS=${(directJsonWithDfsResult.totalSize/directJsonWithDfsResult.totalDuration/1000).toFixed(2)}KB/s (${directDfsTotalKB}KB)
      </div>
      ${directJsonWithDfsResult.dfsLength !== undefined ?
        `<div style="font-size: 11px; color: #999; margin-top: 2px;">
          DFS counted ${directJsonWithDfsResult.dfsLength} chars vs JSON.stringify ${JSON.stringify(jsonStringifyResult).length} chars
        </div>` : ''}
    </div>
  `;

  // Reset for next benchmark
  benchmarkResults = { jsonStringify: null, directJson: null, directJsonWithDfs: null };
}

// Handle port disconnect
port.onDisconnect.addListener(() => {
  console.log('Disconnected from background');
  document.getElementById('messageContainer').innerHTML = '<div style="color: red;">Disconnected from background service worker</div>';
});

// Generate a complex JSON object with nested structures
function generateComplexJsonObject(sizeHint = 10000) {
  const categories = ['electronics', 'clothing', 'books', 'home', 'sports', 'automotive'];
  const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange'];
  const statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled'];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  // Calculate approximate items needed to reach size hint
  const baseObjectSize = 200; // Rough estimate of base object size in JSON
  const targetItems = Math.max(1, Math.floor(sizeHint / baseObjectSize));

  const data = {
    metadata: {
      version: '2.1.0',
      generated: new Date().toISOString(),
      totalItems: targetItems,
      schema: 'benchmark_data_v2'
    },

    users: [],
    products: [],
    orders: [],
    analytics: {
      daily: [],
      monthly: []
    },

    configuration: {
      features: {
        darkMode: true,
        notifications: true,
        analytics: false,
        experimental: {
          beta: true,
          alpha: false,
          gamma: null
        }
      },
      limits: {
        maxUsers: 10000,
        maxProducts: 50000,
        maxOrders: 100000,
        timeout: 30000
      }
    }
  };

  // Generate users
  const userCount = Math.max(1, Math.floor(targetItems * 0.3));
  for (let i = 0; i < userCount; i++) {
    data.users.push({
      id: `user_${i + 1}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      email: `user${i + 1}@example.com`,
      age: 18 + (i % 50),
      status: statuses[i % statuses.length],
      preferences: {
        theme: colors[i % colors.length],
        notifications: i % 2 === 0,
        language: i % 3 === 0 ? 'en' : i % 3 === 1 ? 'es' : 'fr'
      },
      address: {
        street: `${123 + i} Main St`,
        city: `City${i % 10}`,
        state: `State${i % 5}`,
        zipCode: `${10000 + i}`,
        coordinates: {
          lat: 40.7128 + (i % 100) * 0.01,
          lng: -74.0060 + (i % 100) * 0.01
        }
      },
      tags: [
        `tag_${i % 10}`,
        `category_${categories[i % categories.length]}`,
        `level_${i % 5}`
      ]
    });
  }

  // Generate products
  const productCount = Math.max(1, Math.floor(targetItems * 0.4));
  for (let i = 0; i < productCount; i++) {
    data.products.push({
      id: `product_${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[i % categories.length],
      price: parseFloat((9.99 + (i % 1000) * 0.50).toFixed(2)),
      description: `This is a detailed description for product ${i + 1}. It includes many features and benefits.`,
      specifications: {
        weight: parseFloat((0.1 + (i % 100) * 0.05).toFixed(2)),
        dimensions: {
          height: 10 + (i % 20),
          width: 5 + (i % 15),
          depth: 2 + (i % 8)
        },
        color: colors[i % colors.length],
        material: i % 4 === 0 ? 'plastic' : i % 4 === 1 ? 'metal' : i % 4 === 2 ? 'wood' : 'fabric'
      },
      inventory: {
        inStock: i % 10 !== 0,
        quantity: i % 10 === 0 ? 0 : 1 + (i % 100),
        reserved: Math.floor((i % 20) / 2),
        reorderLevel: 5 + (i % 15)
      }
    });
  }

  // Generate orders
  const orderCount = Math.max(1, Math.floor(targetItems * 0.3));
  for (let i = 0; i < orderCount; i++) {
    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }, (_, j) => ({
      productId: `product_${((i + j) % productCount) + 1}`,
      quantity: 1 + (j % 3),
      price: parseFloat((9.99 + ((i + j) % 1000) * 0.50).toFixed(2))
    }));

    data.orders.push({
      id: `order_${i + 1}`,
      userId: `user_${(i % userCount) + 1}`,
      status: statuses[i % statuses.length],
      items: items,
      total: parseFloat(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)),
      shipping: {
        method: i % 3 === 0 ? 'standard' : i % 3 === 1 ? 'express' : 'overnight',
        address: {
          street: `${456 + i} Shipping St`,
          city: `ShipCity${i % 8}`,
          state: `ShipState${i % 6}`,
          zipCode: `${20000 + i}`
        }
      },
      timestamps: {
        created: new Date(Date.now() - i * 3600000).toISOString(),
        updated: new Date(Date.now() - i * 1800000).toISOString()
      }
    });
  }

  return data;
}

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

// Add click handler for send message button
document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('sendMessage');
  const messageSizeInput = document.getElementById('messageSize');
  let messageCount = 0;

  sendButton.addEventListener('click', async () => {
    messageCount++;
    const targetSize = parseInt(messageSizeInput.value) || 10000;

    // Reset benchmark results
    benchmarkResults = { jsonStringify: null, directJson: null, directJsonWithDfs: null };

    // Update UI to show we're starting the benchmark
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `
      <div style="color: #007cba; font-weight: bold;">Starting JSON benchmark with ~${Math.round(targetSize/1024)}KB data...</div>
      <div style="color: #666; font-size: 12px; margin-top: 5px;">Sending JSON.stringify, Direct JSON, and Direct JSON + DFS messages...</div>
    `;

    // Generate the complex JSON object
    const jsonData = generateComplexJsonObject(targetSize);
    console.time("JSON.stringify")
    console.log(JSON.stringify(jsonData).length);
    console.timeEnd("JSON.stringify");
    const jsonString = JSON.stringify(jsonData);
    console.log(`Generated JSON object: ${jsonString.length} characters`);

    // Send messages sequentially, waiting for each response
    try {
      await sendDirectJsonMessage(messageCount, jsonData, jsonString);
      await sendJsonStringifyMessage(messageCount, jsonData, jsonString);
      await sendDirectJsonWithDfsMessage(messageCount, jsonData, jsonString);
    } catch (error) {
      console.error('Benchmark failed:', error);
      const messageContainer = document.getElementById('messageContainer');
      messageContainer.innerHTML = `
        <div style="color: #dc3545; font-weight: bold;">Benchmark failed: ${error.message}</div>
      `;
    }
  });

  function sendJsonStringifyMessage(count, jsonData, jsonString) {
    return new Promise((resolve, reject) => {
      const messageId = `json_stringify_${count}_${Date.now()}`;

      // Create string message with message ID and sigil
      // Format: messageId|stringified_json_data
      const sigil = '|';
      const messageWithId = messageId + sigil + jsonString;
      const dataSize = jsonString.length;
      const totalSize = messageWithId.length;

      console.log(`📤 Sending JSON.stringify: ${totalSize} characters (${dataSize} data + ${totalSize - dataSize} header), ID: ${messageId}`);

      // Set up promise resolution tracking
      const promiseData = { resolve, reject, type: 'JSON.stringify' };
      sentMessages.set(messageId + '_promise', promiseData);

      try {
        const sentTime = performance.now();
        sentMessages.set(messageId, sentTime);
        sentMessages.set(messageId + '_data', { type: 'JSON.stringify', size: dataSize, totalSize: totalSize });

        // Send stringified JSON
        port.postMessage(messageWithId);
      } catch (error) {
        console.error('Failed to send JSON.stringify:', error);
        sentMessages.delete(messageId);
        sentMessages.delete(messageId + '_promise');
        reject(error);
      }
    });
  }

  function sendDirectJsonMessage(count, jsonData, jsonString) {
    return new Promise((resolve, reject) => {
      const messageId = `direct_json_${count}_${Date.now()}`;

      // Create direct JSON message
      const messageObject = {
        type: 'json_benchmark',
        messageId: messageId,
        data: jsonData,
        timestamp: new Date().toISOString()
      };

      const dataSize = jsonString.length;

      // Measure the actual stringification time for the wrapper object
      const stringifyStart = performance.now();
      const totalSize = JSON.stringify(messageObject).length;
      const stringifyTime = performance.now() - stringifyStart;

      console.log(`📤 Sending Direct JSON: ${totalSize} characters (${dataSize} data + ${totalSize - dataSize} structure), ID: ${messageId}`);
      console.log(`📊 Direct JSON stringify overhead: ${stringifyTime.toFixed(3)}ms for ${totalSize - dataSize} wrapper chars`);

      // Set up promise resolution tracking
      const promiseData = { resolve, reject, type: 'Direct JSON' };
      sentMessages.set(messageId + '_promise', promiseData);

      try {
        const sentTime = performance.now();
        sentMessages.set(messageId, sentTime);
        sentMessages.set(messageId + '_data', { type: 'Direct JSON', size: dataSize, totalSize: totalSize, stringifyTime: stringifyTime });

        // Send direct JSON object
        console.time('Direct message');
        port.postMessage(messageObject);
        console.timeEnd('Direct message');
      } catch (error) {
        console.error('Failed to send Direct JSON:', error);
        sentMessages.delete(messageId);
        sentMessages.delete(messageId + '_promise');
        reject(error);
      }
    });
  }

  function sendDirectJsonWithDfsMessage(count, jsonData, jsonString) {
    return new Promise((resolve, reject) => {
      const messageId = `direct_json_dfs_${count}_${Date.now()}`;

      // Measure DFS traversal time
      const dfsStart = performance.now();
      const dfsLength = countJsonStringifyLength(jsonData);
      const dfsTime = performance.now() - dfsStart;
      console.log(dfsLength, JSON.stringify(jsonData).length);

      // Create direct JSON message with DFS timing included
      const messageObject = {
        type: 'json_benchmark_dfs',
        messageId: messageId,
        data: jsonData,
        dfsLength: dfsLength,
        dfsTime: 0,
        timestamp: new Date().toISOString()
      };

      const dataSize = jsonString.length;
      const totalSize = JSON.stringify(messageObject).length;

      console.log(`Sending Direct JSON + DFS: ${totalSize} characters (${dataSize} data + ${totalSize - dataSize} structure), ID: ${messageId}`);
      console.log(`DFS traversal took ${dfsTime.toFixed(2)}ms and counted ${dfsLength} characters (vs JSON.stringify ${jsonString.length})`);

      // Set up promise resolution tracking
      const promiseData = { resolve, reject, type: 'Direct JSON + DFS' };
      sentMessages.set(messageId + '_promise', promiseData);

      try {
        const sentTime = performance.now();
        sentMessages.set(messageId, sentTime);
        sentMessages.set(messageId + '_data', {
          type: 'Direct JSON + DFS',
          size: dataSize,
          totalSize: totalSize,
          dfsLength: dfsLength,
          dfsTime: dfsTime
        });

        // Send direct JSON object
        port.postMessage(messageObject);
      } catch (error) {
        console.error('Failed to send Direct JSON + DFS:', error);
        sentMessages.delete(messageId);
        sentMessages.delete(messageId + '_promise');
        reject(error);
      }
    });
  }  function showError(type, errorMessage, size) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `
      <div style="color: #dc3545; font-weight: bold;">Error sending ${type}:</div>
      <div style="color: #dc3545; margin-top: 5px;">${errorMessage}</div>
      <div style="color: #666; font-size: 12px; margin-top: 5px;">Size: ${size} characters</div>
    `;
  }
});

console.log('Popup script setup complete');
