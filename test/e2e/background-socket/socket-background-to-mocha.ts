import log from 'loglevel';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { MessageType, WindowProperties } from './types';

/**
 * This singleton class runs on the Extension background script (service worker in MV3).
 * It's used to communicate from the Extension background script to the Mocha/Selenium test.
 * The main advantage is that it can call chrome.tabs.query().
 * We had hoped it would be able to call chrome.tabs.highlight(), but Selenium doesn't see the tab change.
 */
class SocketBackgroundToMocha {
  private client: WebSocket;

  constructor() {
    this.client = new WebSocket('ws://localhost:8111');

    this.client.onopen = () =>
      log.debug('SocketBackgroundToMocha WebSocket connection opened');

    this.client.onmessage = (ev: MessageEvent) => {
      let message: MessageType;

      try {
        message = JSON.parse(ev.data);
      } catch (e) {
        throw new Error(
          `Error in JSON sent to SocketBackgroundToMocha: ${
            (e as Error).message
          }`,
        );
      }

      this.receivedMessage(message);
    };

    this.client.onclose = () =>
      log.debug('SocketBackgroundToMocha WebSocket connection closed');

    this.client.onerror = (error) =>
      log.error('SocketBackgroundToMocha WebSocket error:', error);
  }

  /**
   * Waits until a window with the given property is open.
   * delayStep = 200ms, timeout = 10s
   *
   * You can think of this kind of like a template function:
   * If `property` is `title`, then this becomes `waitUntilWindowWithTitle`
   * If `property` is `url`, then this becomes `waitUntilWindowWithUrl`
   * Remember that `a[property]` becomes `a.title` or `a.url`
   *
   * @param property - 'title' or 'url'
   * @param value - The value we're searching for and want to wait for
   * @returns The handle of the window tab with the given property value
   */
  async waitUntilWindowWithProperty(property: WindowProperties, value: string) {
    let tabs: chrome.tabs.Tab[] = [];
    const delayStep = 200;
    const timeout = 10000;

    for (
      let timeElapsed = 0;
      timeElapsed <= timeout;
      timeElapsed += delayStep
    ) {
      tabs = await this.queryTabs({});

      const index = tabs.findIndex((a) => a[property] === value);

      if (index !== -1) {
        this.send({ command: 'openTabs', tabs: this.cleanTabs(tabs) });
        return;
      }

      // wait for delayStep milliseconds
      await new Promise((resolve) => setTimeout(resolve, delayStep));
    }

    // The window was not found at the end of the timeout
    this.send({
      command: 'notFound',
      property,
      value,
      tabs: this.cleanTabs(tabs),
    });
  }

  // This function exists to support both MV2 and MV3
  private async queryTabs(queryInfo: object): Promise<chrome.tabs.Tab[]> {
    if (isManifestV3) {
      // With MV3, chrome.tabs.query has an await form
      return await chrome.tabs.query(queryInfo);
    }

    // With MV2, we have to wrap chrome.tabs.query in a Promise
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]) => {
        resolve(tabs);
      });
    });
  }

  // Clean up the tab data before sending them to the client
  private cleanTabs(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] {
    return tabs.map((tab) => {
      // This field can be very long, and is not needed
      if (tab.favIconUrl && tab.favIconUrl.length > 40) {
        tab.favIconUrl = undefined;
      }

      return tab;
    });
  }

  // Send a message to the Mocha/Selenium test
  send(message: MessageType) {
    this.client.send(JSON.stringify(message));
  }

  // Handle messages received from the Mocha/Selenium test
  private async receivedMessage(message: MessageType) {
    log.debug('SocketBackgroundToMocha received message:', message);

    if (message.command === 'queryTabs') {
      const tabs = await this.queryTabs({ title: message.title });
      log.debug('SocketBackgroundToMocha sending tabs:', tabs);
      this.send({ command: 'openTabs', tabs: this.cleanTabs(tabs) });
    } else if (
      message.command === 'waitUntilWindowWithProperty' &&
      message.property &&
      message.value
    ) {
      this.waitUntilWindowWithProperty(message.property, message.value);
    }
  }
}

// Singleton setup below
let _socketBackgroundToMocha: SocketBackgroundToMocha;

export function getSocketBackgroundToMocha() {
  if (!_socketBackgroundToMocha) {
    startSocketBackgroundToMocha();
  }

  return _socketBackgroundToMocha;
}

function startSocketBackgroundToMocha() {
  if (process.env.IN_TEST) {
    _socketBackgroundToMocha = new SocketBackgroundToMocha();
  }
}
