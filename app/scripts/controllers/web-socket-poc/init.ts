import throttle from 'lodash/throttle';

export function initSocketAndDoStuff(handler: () => void) {
  const throttledHandler = throttle(handler, 500);
  const maxRetries = 5;
  let retryCount = 0;
  let ws: WebSocket;

  function connect() {
    ws = new WebSocket(
      'wss://polygon-mainnet.dev.infura.org/ws/v3/4342f4554a734773a08d92c9136bdcfa',
    );

    ws.onopen = () => {
      console.log('WS: Connected to WebSocket');
      retryCount = 0; // Reset retry count on successful connection

      const message = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: [
          'infura_balanceUpdates',
          {
            address: '0x3EB132069C3C4f6C8632505Fd344925645eb27C5', // account 1
            contractAddress: [
              '0x0000000000000000000000000000000000000000',
              '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            ], // POL, Bridged USDC
          },
        ],
      };

      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      console.log('WS: Received:', event.data);
      throttledHandler();
    };

    ws.onclose = () => {
      console.log('WS: Disconnected from WebSocket');
      attemptReconnect();
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }

  function attemptReconnect() {
    if (retryCount < maxRetries) {
      retryCount++;
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff with a cap
      console.log(
        `WS: Attempting to reconnect in ${retryDelay / 1000} seconds...`,
      );
      setTimeout(connect, retryDelay);
    } else {
      console.error('WS: Max retries reached. Could not reconnect.');
    }
  }

  connect();
}
