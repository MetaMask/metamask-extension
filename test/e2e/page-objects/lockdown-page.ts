import { Driver, PAGES } from '../webdriver/driver';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';

class LockdownPage {
  private driver: Driver;
  private lockdownTestScript: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.lockdownTestScript = `
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (isFirefox) {
        globalThis = window;
      }

      const assert = {
        equal: (value, comparison, message) => {
          if (value !== comparison) {
            throw new Error(message || 'not equal');
          }
        },
        ok: (value, message) => {
          if (!value) {
            throw new Error(message || 'not ok');
          }
        },
      };

      function getGlobalProperties() {
        return Object.getOwnPropertyNames(globalThis);
      }

      function testIntrinsic(propertyName) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, propertyName);
        assert.ok(descriptor, \`\${propertyName} should exist\`);
        assert.ok(!descriptor.configurable, \`\${propertyName} should not be configurable\`);
        assert.ok(!descriptor.writable, \`\${propertyName} should not be writable\`);
      }

      try {
        getGlobalProperties().forEach((propertyName) => {
          console.log('Testing intrinsic:', propertyName);
          testIntrinsic(propertyName);
        });
        console.log('Lockdown test successful!');
        return true;
      } catch (error) {
        console.log('Lockdown test failed.', error);
        return false;
      }
    `;
  }

  async navigateToHomePage(): Promise<void> {
    await this.driver.navigate(PAGES.HOME);
  }

  async navigateToBackgroundPage(): Promise<void> {
    if (isManifestV3) {
      await this.driver.navigate(PAGES.OFFSCREEN);
    } else {
      await this.driver.navigate(PAGES.BACKGROUND);
    }
    await this.driver.delay(1000);
  }

  async testUIEnvironmentLockdown(): Promise<boolean> {
    return await this.driver.executeScript(this.lockdownTestScript);
  }

  async testBackgroundEnvironmentLockdown(): Promise<boolean> {
    return await this.driver.executeScript(this.lockdownTestScript);
  }
}

export default LockdownPage;
