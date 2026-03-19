import { SpeculosClient } from '../speculos/client';

export class SpeculosHIDDevice implements HIDDevice {
  opened = false;
  vendorId = 0x2c97;
  productId = 0x0001;
  productName = 'Ledger Nano S Plus';
  collections: HIDCollectionInfo[] = [];

  private speculosClient: SpeculosClient;
  private reportCallbacks: Array<(e: HIDInputReportEvent) => void> = [];

  constructor(client: SpeculosClient) {
    this.speculosClient = client;
  }

  async open(): Promise<void> {
    this.opened = true;
  }

  async close(): Promise<void> {
    this.opened = false;
  }

  async sendReport(reportId: number, data: BufferSource): Promise<void> {
    const apdu = Buffer.from(data as ArrayBuffer);

    try {
      const response = await this.speculosClient.exchange(apdu);

      // Dispatch as input report
      setTimeout(() => {
        const event = new SpeculosInputReportEvent(this, response);
        this.reportCallbacks.forEach((cb) => cb(event));
      }, 10);
    } catch (error) {
      console.error('[SpeculosHIDDevice] APDU exchange failed:', error);
      throw error;
    }
  }

  addEventListener(
    type: 'inputreport',
    callback: (e: HIDInputReportEvent) => void,
  ): void {
    this.reportCallbacks.push(callback);
  }

  removeEventListener(
    type: 'inputreport',
    callback: (e: HIDInputReportEvent) => void,
  ): void {
    const idx = this.reportCallbacks.indexOf(callback);
    if (idx > -1) this.reportCallbacks.splice(idx, 1);
  }
}

class SpeculosInputReportEvent implements HIDInputReportEvent {
  type = 'inputreport' as const;
  data: DataView;
  device: HIDDevice;

  constructor(device: HIDDevice, buffer: Buffer) {
    this.device = device;
    this.data = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );
  }
}
