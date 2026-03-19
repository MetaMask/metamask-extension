import { SpeculosClient } from '../speculos/client';

export class WebHIDSpeculosBridge {
  private client: SpeculosClient;
  private isInjected = false;

  constructor(client: SpeculosClient) {
    this.client = client;
  }

  /**
   * Inject mock WebHID into browser page
   */
  async inject(driver: any): Promise<void> {
    if (this.isInjected) return;

    const deviceInfo = {
      vendorId: 0x2c97,
      productId: 0x0001,
      productName: 'Ledger Nano S Plus',
    };

    await driver.executeScript((info: typeof deviceInfo) => {
      const originalHID = navigator.hid;
      (window as any).__originalHID = originalHID;

      const mockHID = {
        async getDevices(): Promise<HIDDevice[]> {
          const device = (window as any).__speculosDevice;
          return device ? [device] : [];
        },

        async requestDevice(): Promise<HIDDevice[]> {
          const device = (window as any).__speculosDevice;
          return device ? [device] : [];
        },

        addEventListener() {},
        removeEventListener() {},
      };

      Object.defineProperty(navigator, 'hid', {
        value: mockHID,
        writable: true,
        configurable: true,
      });

      (window as any).__speculosDevice = {
        vendorId: info.vendorId,
        productId: info.productId,
        productName: info.productName,
        opened: false,

        async open(): Promise<void> {
          this.opened = true;
        },

        async close(): Promise<void> {
          this.opened = false;
        },

        async sendReport(reportId: number, data: ArrayBuffer): Promise<void> {
          window.parent.postMessage(
            {
              type: 'SPECULOS_APDU',
              reportId,
              data: Array.from(new Uint8Array(data)),
            },
            '*',
          );
        },

        addEventListener(type: string, cb: Function) {
          (window as any).__inputReportCallbacks =
            (window as any).__inputReportCallbacks || [];
          (window as any).__inputReportCallbacks.push(cb);
        },

        removeEventListener(type: string, cb: Function) {
          const cbs = (window as any).__inputReportCallbacks || [];
          const idx = cbs.indexOf(cb);
          if (idx > -1) cbs.splice(idx, 1);
        },
      };

      window.addEventListener('message', (e) => {
        if (e.data?.type === 'SPECULOS_RESPONSE') {
          const cbs = (window as any).__inputReportCallbacks || [];
          const buffer = new Uint8Array(e.data.data).buffer;

          cbs.forEach((cb: Function) => {
            cb({
              type: 'inputreport',
              device: (window as any).__speculosDevice,
              data: new DataView(buffer),
              reportId: e.data.reportId,
            });
          });
        }
      });
    }, deviceInfo);

    this.isInjected = true;
  }

  async handleAPDU(data: number[]): Promise<Buffer> {
    const apdu = Buffer.from(data);
    return this.client.exchange(apdu);
  }

  async restore(driver: any): Promise<void> {
    if (!this.isInjected) return;

    await driver.executeScript(() => {
      if ((window as any).__originalHID) {
        Object.defineProperty(navigator, 'hid', {
          value: (window as any).__originalHID,
          writable: true,
          configurable: true,
        });
      }
      delete (window as any).__speculosDevice;
      delete (window as any).__inputReportCallbacks;
    });

    this.isInjected = false;
  }
}
