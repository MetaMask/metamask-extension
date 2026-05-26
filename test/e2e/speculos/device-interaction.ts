import type { SpeculosClient } from './client';
import type { DeviceModel } from './constants';

export type DeviceInteraction = {
  approveTransaction(): Promise<void>;
  approveSigning(): Promise<void>;
  rejectTransaction(): Promise<void>;
  approveBlindSigning(scrollCount?: number): Promise<void>;
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

  async approveSigning(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      await this.client.pressButton('right');
      await delay(500);
    }
    await this.client.pressButton('both');
    await delay(500);
  }

  // Scroll count depends on the number of review screens the Ledger Ethereum app
  // shows before the Accept/Reject screen. Known ERC20 methods (transfer, approve)
  // have special parsing and show 4 screens (type, amount, fee, data summary).
  // Unknown methods display raw hex data across multiple pages, requiring more
  // scrolls (e.g. increaseAllowance needs 7 — amount, fee, data p1–p4, accept/reject).
  async approveBlindSigning(scrollCount = 4): Promise<void> {
    await this.client.pressButton('both');
    await delay(800);
    for (let i = 0; i < scrollCount; i++) {
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
    // DISABLED: REST /apdu check may conflict with socket APDU exchange
    // try {
    //   const config = await this.client.getAppConfiguration();
    //   console.log(
    //     `[DeviceInteraction] Ethereum app v${config.major}.${config.minor}.${config.patch} blind_signing=${config.blindSigningEnabled}`,
    //   );
    //   if (config.blindSigningEnabled) {
    //     console.log('[DeviceInteraction] Blind signing already enabled, skipping');
    //     return;
    //   }
    // } catch (e) {
    //   console.warn('[DeviceInteraction] Could not query app configuration:', e);
    // }

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

  private async swipeLeft(): Promise<void> {
    const { width, height } = this.model.screenSize;
    const cx = width / 2;
    const cy = height / 2;
    await this.client.fingerSwipe(cx, cy, cx - 10, cy, 0.5);
    await delay(800);
  }

  private async tapConfirm(holdSeconds = 3.0): Promise<void> {
    if (this.model.reviewConfirmButton) {
      await this.client.fingerTap(
        this.model.reviewConfirmButton.x,
        this.model.reviewConfirmButton.y,
        holdSeconds,
      );
    }
  }

  private async tapReject(): Promise<void> {
    if (this.model.reviewRejectButton) {
      await this.client.fingerTap(
        this.model.reviewRejectButton.x,
        this.model.reviewRejectButton.y,
        0.1,
      );
    }
  }

  private async tapBack(): Promise<void> {
    if (this.model.backButton) {
      await this.client.fingerTap(
        this.model.backButton.x,
        this.model.backButton.y,
        0.1,
      );
    }
  }

  private async tapHome(): Promise<void> {
    if (this.model.homeButton) {
      await this.client.fingerTap(
        this.model.homeButton.x,
        this.model.homeButton.y,
        0.1,
      );
    }
  }

  async approveTransaction(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await this.swipeLeft();
    }
    await this.tapConfirm();
    await delay(500);
  }

  async approveSigning(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      await this.swipeLeft();
    }
    await this.tapConfirm();
    await delay(500);
  }

  async approveBlindSigning(scrollCount = 4): Promise<void> {
    console.log(
      `[DeviceInteraction] approveBlindSigning: tapping 'Accept risk and continue'`,
    );
    // Stage 1: Dismiss the "Blind signing ahead" warning by tapping
    // "Accept risk and continue" at the bottom of the screen.
    await this.client.fingerTap(
      this.model.confirmButton?.x ?? 240,
      this.model.confirmButton?.y ?? 530,
      0.1,
    );
    await delay(800);

    // Stage 2: Navigate the review screens (e.g., "1 of 4", "2 of 4", ...)
    // and hold the confirm button to sign.
    console.log(
      `[DeviceInteraction] approveBlindSigning: swiping ${scrollCount} review screens + hold confirm`,
    );
    for (let i = 0; i < scrollCount; i++) {
      await this.swipeLeft();
      await delay(300);
    }
    await this.tapConfirm();
    await delay(500);
    console.log('[DeviceInteraction] approveBlindSigning: done');
  }

  async rejectTransaction(): Promise<void> {
    await this.tapReject();
    await delay(500);
  }

  async enableBlindSigning(): Promise<void> {
    // NBGL devices (flex/stax) cannot toggle blind signing via the Speculos
    // UI because the NBGL settings toggle is unresponsive to touch events in
    // emulation. Instead, blind signing is pre-enabled via a NVRAM binary
    // that is loaded with --load-nvram at container startup. Skip the UI
    // navigation entirely.
    console.log(
      '[DeviceInteraction] Blind signing pre-enabled via NVRAM for NBGL device',
    );
  }

  private async findTextPosition(
    searchText: string,
  ): Promise<{ x: number; y: number; w: number; h: number } | null> {
    try {
      const events = await this.client.getEvents();
      const match = events.find((e) => e.text === searchText);
      return match ?? null;
    } catch {
      return null;
    }
  }

  async navigateToMainMenu(): Promise<void> {
    await this.tapBack();
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
