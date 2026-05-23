/**
 * Returns browser-side WebHID mock source (Speculos / ApduBridge over WebSocket).
 * Uses Ledger HID framing: each sendReport forwards one frame; ApduBridge reassembles APDUs.
 * @param wsPort
 */
export function getWebHidMockScript(wsPort: number): string {
  return `
    (function() {
      if (window.__webHIDMockInjected) return;
      window.__webHIDMockInjected = true;

      const _WS = WebSocket;
      const _WS_OPEN = WebSocket.OPEN;
      const _WS_CONNECTING = WebSocket.CONNECTING;

      const wsPort = ${wsPort};
      let ws = null;
      let messageId = 0;
      const pendingExchanges = new Map();

      const LEDGER_COLLECTIONS = [{
        usagePage: 0xffa0,
        usage: 0x01,
        inputReports: [{ reportId: 0 }],
        outputReports: [{ reportId: 0 }],
        featureReports: [],
      }];

      const connectWebSocket = function() {
        if (ws && (ws.readyState === _WS.OPEN || ws.readyState === _WS.CONNECTING)) {
          return;
        }
        ws = new _WS('ws://localhost:' + wsPort);

        ws.onopen = function() {
          console.log('[WebHID Mock] WebSocket connected');
        };

        ws.onmessage = function(event) {
          const response = JSON.parse(event.data);
          if (response.type === 'HID_RECV') {
            const pending = pendingExchanges.get(response.id);
            if (!pending) return;
            const cbs = window.__inputReportCallbacks || [];
            const frame = new Uint8Array(response.data);
            cbs.forEach(function(cb) {
              cb({
                type: 'inputreport',
                device: pending.device,
                data: new DataView(frame.buffer, frame.byteOffset, frame.byteLength),
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
              pending.reject(new Error(response.error));
            }
          }
        };

        ws.onclose = function() {
          console.log('[WebHID Mock] WebSocket disconnected');
          ws = null;
        };

        ws.onerror = function(error) {
          console.error('[WebHID Mock] WebSocket error:', error);
        };
      };

      const runHidExchange = function(device, frameData) {
        return new Promise(function(resolve, reject) {
          const startSend = function() {
            if (!ws || ws.readyState !== _WS_OPEN) {
              reject(new Error('WebSocket not connected'));
              return;
            }
            messageId += 1;
            const id = messageId;
            pendingExchanges.set(id, { resolve: resolve, reject: reject, device: device });
            ws.send(JSON.stringify({
              type: 'HID_SEND',
              id: id,
              data: Array.from(frameData),
            }));
          };

          if (ws && ws.readyState === _WS_OPEN) {
            startSend();
            return;
          }
          if (!ws || ws.readyState !== _WS_CONNECTING) {
            connectWebSocket();
          }
          const socket = ws;
          if (!socket) {
            reject(new Error('WebSocket not initialized'));
            return;
          }
          const onOpen = function() {
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('error', onErr);
            startSend();
          };
          const onErr = function() {
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('error', onErr);
            reject(new Error('WebSocket failed to open'));
          };
          socket.addEventListener('open', onOpen);
          socket.addEventListener('error', onErr);
        });
      };

      const mockDevice = {
        vendorId: 0x2c97,
        productId: 0x0001,
        productName: 'Ledger Nano S Plus',
        collections: LEDGER_COLLECTIONS,
        opened: false,

        open: function() {
          this.opened = true;
          return Promise.resolve();
        },

        close: function() {
          this.opened = false;
          return Promise.resolve();
        },

        forget: function() {
          this.opened = false;
          return Promise.resolve();
        },

        sendReport: function(reportId, data) {
          const frame = new Uint8Array(data);
          return runHidExchange(this, frame);
        },

        receiveReport: function() {
          return Promise.resolve(new DataView(new ArrayBuffer(0)));
        },

        addEventListener: function(type, cb) {
          if (type === 'inputreport' && cb) {
            window.__inputReportCallbacks = window.__inputReportCallbacks || [];
            window.__inputReportCallbacks.push(cb);
          }
        },

        removeEventListener: function(type, cb) {
          if (type === 'inputreport' && cb) {
            const cbs = window.__inputReportCallbacks || [];
            const idx = cbs.indexOf(cb);
            if (idx > -1) {
              cbs.splice(idx, 1);
            }
          }
        },
      };

      const mockHID = {
        getDevices: function() {
          return Promise.resolve([mockDevice]);
        },

        requestDevice: function() {
          return Promise.resolve([mockDevice]);
        },

        addEventListener: function() {},
        removeEventListener: function() {},
      };

      Object.defineProperty(navigator, 'hid', {
        value: mockHID,
        writable: true,
        configurable: true,
      });

      window.__speculosDevice = mockDevice;
      connectWebSocket();
      console.log('[WebHID Mock] Installed (HID framing → ApduBridge)');
    })();
  `;
}
