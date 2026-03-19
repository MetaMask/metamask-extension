import { SpeculosClient } from './client';

/**
 * Helper for automating button presses in Speculos
 * Can work in manual mode (explicit presses) or auto mode (rules-based)
 */
export class SpeculosAutomation {
  private client: SpeculosClient;
  private isAutoApproveEnabled = false;

  constructor(client: SpeculosClient) {
    this.client = client;
  }

  /**
   * Enable auto-approval for all transactions
   * Speculos will automatically press 'both' buttons when "Accept" appears
   */
  async enableAutoApprove(): Promise<void> {
    const automationRules = {
      version: 1,
      rules: [
        {
          // Auto-approve transactions
          text: 'Accept',
          actions: [
            ['button', 2, true],
            ['button', 2, false],
          ],
        },
        {
          // Handle "Accept and send" text variation
          text: 'Accept and send',
          actions: [
            ['button', 2, true],
            ['button', 2, false],
          ],
        },
        {
          // Auto-scroll through transaction details
          text: 'Review',
          actions: [
            ['button', 2, true],
            ['button', 2, false],
          ],
        },
      ],
    };

    await this.client.sendAutomationRules(automationRules);
    this.isAutoApproveEnabled = true;
    console.log('[SpeculosAutomation] Auto-approve enabled');
  }

  /**
   * Disable auto-approval
   */
  async disableAutoApprove(): Promise<void> {
    await this.client.clearAutomationRules();
    this.isAutoApproveEnabled = false;
    console.log('[SpeculosAutomation] Auto-approve disabled');
  }

  /**
   * Manually approve current screen
   */
  async approve(): Promise<void> {
    if (this.isAutoApproveEnabled) {
      console.warn(
        '[SpeculosAutomation] Auto-approve is enabled, manual approve may conflict',
      );
    }
    await this.client.pressButton('both');
  }

  /**
   * Manually reject current screen
   */
  async reject(): Promise<void> {
    if (this.isAutoApproveEnabled) {
      console.warn(
        '[SpeculosAutomation] Auto-approve is enabled, manual reject may conflict',
      );
    }
    // Scroll to reject option then press both
    await this.client.pressButton('right');
    await this.client.pressButton('both');
  }

  /**
   * Scroll through transaction details
   * @param times Number of times to press right button
   */
  async scroll(times: number = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.client.pressButton('right');
      await this.delay(200); // Small delay between scrolls
    }
  }

  /**
   * Wait for screen to show specific text, then approve
   */
  async waitAndApprove(expectedText: string, timeout = 10000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      // Get screenshot and check content (would need OCR or metadata)
      // For now, just wait and approve
      await this.delay(500);

      // Try to approve
      try {
        await this.client.pressButton('both');
        return; // Success
      } catch (e) {
        // Continue waiting
      }
    }

    throw new Error(`Timeout waiting for screen: ${expectedText}`);
  }

  /**
   * Complete transaction flow with verification
   * 1. Review screens
   * 2. Take screenshots
   * 3. Approve
   */
  async approveTransaction(
    options: {
      reviewScreens?: number;
      takeScreenshots?: boolean;
      screenshotPrefix?: string;
    } = {},
  ): Promise<{
    screenshots?: Buffer[];
    approved: boolean;
  }> {
    const {
      reviewScreens = 0,
      takeScreenshots = false,
      screenshotPrefix = 'tx',
    } = options;

    const screenshots: Buffer[] = [];

    // Scroll through review screens
    for (let i = 0; i < reviewScreens; i++) {
      await this.scroll(1);

      if (takeScreenshots) {
        const screenshot = await this.client.getScreenshot();
        screenshots.push(screenshot);
      }
    }

    // Final approval screen
    if (takeScreenshots) {
      const screenshot = await this.client.getScreenshot();
      screenshots.push(screenshot);
    }

    // Approve
    await this.client.pressButton('both');

    return {
      screenshots: takeScreenshots ? screenshots : undefined,
      approved: true,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
