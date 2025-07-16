import { WebElement, WebElementPromise } from 'selenium-webdriver';

export type WebElementWithWaitForElementState = WebElement & {
  waitForElementState: (state: unknown, timeout?: unknown) => WebElementPromise;
};
