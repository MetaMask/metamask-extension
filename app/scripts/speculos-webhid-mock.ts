const SPECULOS_WS_BRIDGE_PORT = 9876;

function installMock(): void {
  if ((window as any).__webHIDMockInjected) {
    return;
  }
  (window as any).__webHIDMockInjected = true;

  const wsPort = SPECULOS_WS_BRIDGE_PORT;
  let ws: WebSocket | null = null;
  let messageId = 0;
  const pendingExchanges = new Map<
    number,
    {
      resolve: () => void;
      reject: (error: Error) => void;
      device: object;
    }
  >();

  const LEDGER_COLLECTIONS = [
    {
      usagePage: 0xffa0,
      usage: 0x01,
      inputReports: [{ reportId: 0 }],
      outputReports: [{ reportId: 0 }],
      featureReports: [],
    },
  ];

  const connectWebSocket = () => {
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    ws = new WebSocket(`ws://localhost:${wsPort}`);

    ws.onopen = () => {
      console.log('[WebHID Mock] WebSocket connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      const response = JSON.parse(event.data as string) as {
        type: string;
        id: number;
        data?: number[];
        error?: string;
      };

      if (response.type === 'HID_RECV' && response.data) {
        const pending = pendingExchanges.get(response.id);
        if (!pending) {
          return;
        }
        const frame = new Uint8Array(response.data);
        const cbs = (window as any).__inputReportCallbacks || [];
        cbs.forEach((cb: Function) => {
          cb({
            type: 'inputreport',
            device: (pending as any).device,
            data: new DataView(
              frame.buffer,
              frame.byteOffset,
              frame.byteLength,
            ),
            reportId: 0,
          });
        });
      } else if (response.type === 'HID_EXCHANGE_COMPLETE') {
        const pending = pendingExchanges.get(response.id);
        if (pending) {
          pendingExchanges.delete(response.id);
          pending.resolve();
        }
      } else if (response.type === 'HID_FRAME_ACK') {
        const pending = pendingExchanges.get(response.id);
        if (pending) {
          pending.resolve();
        }
      } else if (response.type === 'APDU_ERROR') {
        const pending = pendingExchanges.get(response.id);
        if (pending) {
          pendingExchanges.delete(response.id);
          pending.reject(new Error(response.error ?? 'APDU error'));
        }
      }
    };

    ws.onclose = () => {
      console.log('[WebHID Mock] WebSocket disconnected');
      ws = null;
    };

    ws.onerror = () => {
      console.error('[WebHID Mock] WebSocket error');
    };
  };

  const runHidExchange = (
    device: object,
    frameData: Uint8Array,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const startSend = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }
        messageId += 1;
        const id = messageId;
        pendingExchanges.set(id, { resolve, reject, device });
        ws!.send(
          JSON.stringify({
            type: 'HID_SEND',
            id,
            data: Array.from(frameData),
          }),
        );
      };

      if (ws && ws.readyState === WebSocket.OPEN) {
        startSend();
        return;
      }

      if (!ws || ws.readyState !== WebSocket.CONNECTING) {
        connectWebSocket();
      }
      const socket = ws;
      if (!socket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }
      const onOpen = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
        startSend();
      };
      const onError = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
        reject(new Error('WebSocket connection failed'));
      };
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onError);
    });

  const mockDevice = {
    vendorId: 0x2c97,
    productId: 0x0001,
    productName: 'Ledger Nano S Plus',
    collections: LEDGER_COLLECTIONS,
    opened: false,

    open: async () => {
      mockDevice.opened = true;
    },
    close: async () => {
      mockDevice.opened = false;
    },
    forget: async () => {
      mockDevice.opened = false;
    },
    sendReport: async (_reportId: number, data: BufferSource) => {
      const frame = new Uint8Array(data as ArrayBuffer);
      await runHidExchange(mockDevice, frame);
    },
    receiveReport: async () => new DataView(new ArrayBuffer(0)),
    addEventListener: (type: string, cb: Function) => {
      if (type === 'inputreport') {
        (window as any).__inputReportCallbacks =
          (window as any).__inputReportCallbacks || [];
        (window as any).__inputReportCallbacks.push(cb);
      }
    },
    removeEventListener: (type: string, cb: Function) => {
      if (type === 'inputreport') {
        const cbs: Function[] = (window as any).__inputReportCallbacks || [];
        const idx = cbs.indexOf(cb);
        if (idx > -1) {
          cbs.splice(idx, 1);
        }
      }
    },
  };

  const mockHID = {
    getDevices: async () => [mockDevice],
    requestDevice: async () => [mockDevice],
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };

  Object.defineProperty(navigator, 'hid', {
    value: mockHID,
    writable: true,
    configurable: true,
  });

  (window as any).__speculosDevice = mockDevice;
  connectWebSocket();
  console.log(
    '[WebHID Mock] Installed (webpack entry, HID framing -> ApduBridge)',
  );
}

installMock();
