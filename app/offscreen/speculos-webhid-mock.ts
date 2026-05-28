type SpeculosMockDevice = {
  vendorId: number;
  productId: number;
  productName: string;
  collections: HIDCollectionInfo[];
  opened: boolean;
  open: () => Promise<void>;
  close: () => Promise<void>;
  forget: () => Promise<void>;
  sendReport: (reportId: number, data: BufferSource) => Promise<void>;
  receiveReport: (reportId: number) => Promise<DataView>;
  addEventListener: (
    type: string,
    cb: (event: HIDInputReportEvent) => void,
  ) => void;
  removeEventListener: (
    type: string,
    cb: (event: HIDInputReportEvent) => void,
  ) => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export type SpeculosGlobals = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WS: typeof WebSocket;
  win: Window & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __speculosWS?: typeof WebSocket;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __speculosWebHIDMockInstalled?: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __speculosWebSocketPort?: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __speculosDevice?: SpeculosMockDevice;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __inputReportCallbacks?: ((event: HIDInputReportEvent) => void)[];
  };
  nav: Navigator;
};

export function installSpeculosWebHidMock(
  wsPort: number,
  globals: SpeculosGlobals,
): void {
  const { win, nav } = globals;
  const _WS = globals.WS;

  if (
    win.__speculosWebHIDMockInstalled &&
    win.__speculosWebSocketPort === wsPort
  ) {
    return;
  }

  win.__speculosWebHIDMockInstalled = true;
  win.__speculosWebSocketPort = wsPort;

  let ws: WebSocket | null = null;
  let messageId = 0;
  const pendingExchanges = new Map<
    number,
    {
      resolve: () => void;
      reject: (error: Error) => void;
      device: SpeculosMockDevice;
    }
  >();

  const LEDGER_COLLECTIONS: HIDCollectionInfo[] = [
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
      (ws.readyState === _WS.OPEN || ws.readyState === _WS.CONNECTING)
    ) {
      return;
    }
    ws = new _WS(`ws://localhost:${wsPort}`);

    ws.onopen = () => {
      // connected
    };

    ws.onmessage = (event) => {
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
        const cbs = win.__inputReportCallbacks || [];
        cbs.forEach((cb) => {
          cb({
            type: 'inputreport',
            device: pending.device as unknown as HIDDevice,
            data: new DataView(
              frame.buffer,
              frame.byteOffset,
              frame.byteLength,
            ),
            reportId: 0,
          } as HIDInputReportEvent);
        });
      } else if (response.type === 'HID_EXCHANGE_COMPLETE') {
        const pending = pendingExchanges.get(response.id);
        if (pending) {
          pendingExchanges.delete(response.id);
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
      ws = null;
    };
  };

  const runHidExchange = (
    device: SpeculosMockDevice,
    frame: Uint8Array,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const startSend = () => {
        if (!ws || ws.readyState !== _WS.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }
        messageId += 1;
        const id = messageId;
        pendingExchanges.set(id, { resolve, reject, device });
        ws.send(
          JSON.stringify({
            type: 'HID_SEND',
            id,
            data: Array.from(frame),
          }),
        );
      };

      if (ws && ws.readyState === _WS.OPEN) {
        startSend();
        return;
      }

      // Queue until the socket is open instead of guessing with a timeout.
      if (!ws || ws.readyState !== _WS.CONNECTING) {
        connectWebSocket();
      }
      const socket = ws;
      if (!socket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }
      /* eslint-disable @typescript-eslint/no-use-before-define */
      const onOpen = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
        startSend();
      };
      /* eslint-enable @typescript-eslint/no-use-before-define */
      const onError = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
        reject(new Error('WebSocket connection failed'));
      };
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onError);
    });

  const mockDevice: SpeculosMockDevice = {
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

    addEventListener: (
      type: string,
      cb: (event: HIDInputReportEvent) => void,
    ) => {
      if (type === 'inputreport') {
        win.__inputReportCallbacks = win.__inputReportCallbacks || [];
        win.__inputReportCallbacks.push(cb);
      }
    },

    removeEventListener: (
      type: string,
      cb: (event: HIDInputReportEvent) => void,
    ) => {
      if (type === 'inputreport') {
        const cbs = win.__inputReportCallbacks || [];
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

  Object.defineProperty(nav, 'hid', {
    value: mockHID,
    writable: true,
    configurable: true,
  });

  win.__speculosDevice = mockDevice;
  connectWebSocket();
}
