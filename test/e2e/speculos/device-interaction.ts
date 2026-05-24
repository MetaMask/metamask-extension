import type { SpeculosClient } from './client';
import type { DeviceModel } from './constants';

export type DeviceInteraction = {
  approveTransaction(): Promise<void>;
  rejectTransaction(): Promise<void>;
  approveBlindSigning(): Promise<void>;
  enableBlindSigning(): Promise<void>;
  navigateToMainMenu(): Promise<void>;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class NanoInteraction implements DeviceInteraction {
  private client: SpeculosClient;

  constructor(client: SpeculosClient) {
    this.client = client;
  }

  async approveTransaction(): Promise<void> {
    for (let i = 0; i < 6; i++) {
      await this.client.pressButton('right');
      await delay(500);
    }
    await this.client.pressButton('both');
    await delay(500);
  }

  async approveBlindSigning(): Promise<void> {
    await this.client.pressButton('both');
    await delay(800);
    for (let i = 0; i < 4; i++) {
      await this.client.pressButton('right');
      await delay(500);
    }
    await this.client.pressButton('both');
    await delay(500);
  }

  async rejectTransaction(): Promise<void> {
    await this.client.pressButton('right');
    await delay(300);
    await this.client.pressButton('both');
    await delay(500);
  }

  async enableBlindSigning(): Promise<void> {
    await this.client.pressButton('both');
    await delay(800);
    await this.client.pressButton('right');
    await delay(400);
    await this.client.pressButton('both');
    await delay(800);
    await this.client.pressButton('both');
    await delay(800);
    for (let i = 0; i < 6; i++) {
      await this.client.pressButton('right');
      await delay(200);
    }
    await this.client.pressButton('both');
    await delay(500);
    await this.client.pressButton('left');
    await delay(400);
  }

  async navigateToMainMenu(): Promise<void> {
    await this.client.pressButton('left');
    await delay(400);
  }
}

export class TouchInteraction implements DeviceInteraction {
  private client: SpeculosClient;

  private model: DeviceModel;

  constructor(client: SpeculosClient, model: DeviceModel) {
    this.client = client;
    this.model = model;
  }

  async approveTransaction(): Promise<void> {
    const { height, width } = this.model.screenSize;
    for (let i = 0; i < 3; i++) {
      await this.client.fingerSwipe(width / 2, height * 0.7, width / 2, height * 0.3);
      await delay(500);
    }
    if (this.model.confirmButton) {
      await this.client.fingerTap(this.model.confirmButton.x, this.model.confirmButton.y);
    }
    await delay(500);
  }

  async approveBlindSigning(): Promise<void> {
    if (this.model.confirmButton) {
      await this.client.fingerTap(this.model.confirmButton.x, this.model.confirmButton.y);
    }
    await delay(800);
    const { height, width } = this.model.screenSize;
    for (let i = 0; i < 2; i++) {
      await this.client.fingerSwipe(width / 2, height * 0.7, width / 2, height * 0.3);
      await delay(500);
    }
    if (this.model.confirmButton) {
      await this.client.fingerTap(this.model.confirmButton.x, this.model.confirmButton.y);
    }
    await delay(500);
  }

  async rejectTransaction(): Promise<void> {
    if (this.model.rejectButton) {
      await this.client.fingerTap(this.model.rejectButton.x, this.model.rejectButton.y);
    }
    await delay(500);
  }

  async enableBlindSigning(): Promise<void> {
    await this.navigateToMainMenu();
  }

  async navigateToMainMenu(): Promise<void> {
    if (this.model.backButton) {
      await this.client.fingerTap(this.model.backButton.x, this.model.backButton.y);
    }
    await delay(400);
  }
}

export function createDeviceInteraction(
  client: SpeculosClient,
  model: DeviceModel,
): DeviceInteraction {
  if (model.interactionType === 'touch') {
    return new TouchInteraction(client, model);
  }
  return new NanoInteraction(client);
}
