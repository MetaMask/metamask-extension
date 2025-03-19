import debounce from 'lodash/debounce';

export function initSocketAndDoStuff(handler: () => void) {
  // We don't want to fire constantly, otherwise will block UI.
  // Maybe we can explore a Queue (AMPQ/Rabbit?) if we really need to process each response?
  const debonucedHandler = debounce(handler, 10000);

  // Can we deploy this on Polygon, this is expensive to test on ethereum.
  // (also TXs take so much time on ethereum without speedup that the socket closed)
  const ws = new WebSocket(
    'wss://mainnet.dev.infura.org/ws/v3/4342f4554a734773a08d92c9136bdcfa',
  );

  ws.onopen = () => {
    console.log('WS: Connected to WebSocket');

    // This is fine for PoC, but bad in practice.
    // A user can have many tokens, so are we meant to subscribe per address * per token * per chain?
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: [
        'infura_balanceUpdates',
        {
          address: '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6', // replace with my PoC address to test
          contractAddress: '0x8a801c334ebac763822a0d85a595aec6da59c232', // replace with token contract address to watch
        },
      ],
    };

    ws.send(JSON.stringify(message));
  };

  ws.onmessage = (event) => {
    console.log('WS: Received:', event.data);
    // Ideally we should be able to take the event data and either:
    // 1. Target a specific token refetch
    // 2. Do refetches required if the data contains enough information for us to inject state directly.
    // However both of these reach require extensive work/rewiring to work (touching the library code, and adding new methods)
    // for now, we'll just refetch all 🤷
    debonucedHandler();
  };

  ws.onclose = () => {
    console.log('WS: Disconnected from WebSocket');
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };
}

/**
 * DEV NOTES:
 *
 * I think we can replace the underlying PollingController with a new SubscriptionController.
 * It can keep a similar interface:
 * - startPolling becomes startSocket or startSubscription
 * - endPolling becomes closeSocket or closeSubscription
 * This controller will need to handle duplicate subscriptions, and correctly manage subscriptions.
 * - We may need a "keep alive" heartbeat if Infura closes "stale" connections on their end.
 *
 * TokenBalancePollingController becomes TokenBalanceSubscriptionController
 * - On Message Receive - it updates the token state.
 *
 * UI:
 * - Replace dispatch calls for polling with subscriptions
 * - And it works(TM), as state is automatically updated through the socket messages
 *
 * -----
 *
 * Concerns:
 * - We probably need to better handle these sockets, as currently it is only per address per token per chain
 * - An address could have hundreds of tokens on a chain (+ multichain portfolio view shows tokens on all chains)
 *   - This currently would be HUNDREDS of sockets
 *   > In the Chromium source code (Google Chrome for Linux) I can see a max of 30 per host, 256 overall
 *
 * Maybe we can use RabbitMQ (AMPQ), where our server dumps data to topics, and the client listens to topics it currently cares about?
 * - (It's been a while since I used it, but isn't this 1 connection but multiple channels?)
 */
