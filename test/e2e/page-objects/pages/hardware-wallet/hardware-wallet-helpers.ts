import { Driver } from '../../../webdriver/driver';

export async function confirmOrReconnect(driver: Driver): Promise<void> {
  const footerConfirmButton = '[data-testid="confirm-footer-button"]';
  const reconnectButton =
    '[data-testid="reconnect-hardware-wallet-button"]';

  await driver.waitUntil(
    async () => {
      const hasConfirm = await driver.isElementPresent(footerConfirmButton);
      const hasReconnect = await driver.isElementPresent(reconnectButton);
      return hasConfirm || hasReconnect;
    },
    { timeout: 60000, interval: 500 },
  );

  const hasReconnect = await driver.isElementPresent(reconnectButton);
  if (hasReconnect) {
    await driver.clickElement(reconnectButton);
    console.log('[HardwareWallet] Clicked reconnect button');
    await driver.waitForSelector(footerConfirmButton);
    console.log('[HardwareWallet] Confirm button appeared after reconnect');
  }

  await driver.clickElement(footerConfirmButton);
  console.log('[HardwareWallet] Confirm click completed');
}

export async function confirmOrReconnectAndWaitForWindowToClose(
  driver: Driver,
): Promise<void> {
  const footerConfirmButton = '[data-testid="confirm-footer-button"]';
  const reconnectButton =
    '[data-testid="reconnect-hardware-wallet-button"]';

  const hasReconnect = await driver.isElementPresent(reconnectButton);
  if (hasReconnect) {
    await driver.clickElement(reconnectButton);
    await driver.waitForSelector(footerConfirmButton);
  }
  await driver.clickElementAndWaitForWindowToClose(footerConfirmButton);
}
