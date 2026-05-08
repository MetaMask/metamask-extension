import events from 'events';
import { WebSocketServer } from 'ws';
import {
  FixtureResetStrategy,
  MessageType,
  ServerMochaEventEmitterType,
  WindowProperties,
} from './types';

/**
 * This singleton class runs on the Mocha/Selenium test.
 * It's used to communicate from the Mocha/Selenium test to the Extension background script (service worker in MV3).
 */
class ServerMochaToBackground {
  private server: WebSocketServer;

  private ws: WebSocket | null = null;

  private connectionVersion = 0;

  private eventEmitter;

  constructor() {
    this.eventEmitter = new events.EventEmitter<ServerMochaEventEmitterType>();

    this.server = new WebSocketServer({ port: 8111 });

    console.debug('ServerMochaToBackground created');

    this.server.on('connection', (ws: WebSocket) => {
      // Check for existing connection and close it
      if (this.ws) {
        console.error(
          'ServerMochaToBackground got a second client connection, closing the first one',
        );
        this.ws.close();
      }

      this.ws = ws;
      this.connectionVersion += 1;

      console.debug('ServerMochaToBackground got a client connection');
      this.eventEmitter.emit('connection');

      ws.onmessage = (ev: MessageEvent) => {
        let message: MessageType;

        try {
          message = JSON.parse(ev.data);
        } catch (e) {
          throw new Error(
            `Error in JSON sent to ServerMochaToBackground: ${
              (e as Error).message
            }`,
          );
        }

        this.receivedMessage(message);
      };

      ws.onclose = () => {
        this.ws = null;
        console.debug('ServerMochaToBackground disconnected from client');
      };
    });

  }

  // This function is never explicitly called, but in the future it could be
  stop() {
    this.ws?.close();

    this.server.close();

    console.debug('ServerMochaToBackground stopped');
  }

  // Send a message to the Extension background script (service worker in MV3)
  send(message: MessageType) {
    if (!this.ws) {
      throw new Error('No client connected to ServerMochaToBackground');
    }

    this.ws.send(JSON.stringify(message));
  }

  // Handle messages received from the Extension background script (service worker in MV3)
  private receivedMessage(message: MessageType) {
    if (message.command === 'openTabs' && message.tabs) {
      this.eventEmitter.emit('openTabs', message.tabs);
    } else if (message.command === 'fixtureStateReset') {
      this.eventEmitter.emit('fixtureStateReset', message);
    } else if (message.command === 'fixtureStateResetError') {
      const error = new Error(
        message.error ?? 'Unknown fixture state reset error',
      );
      if (this.eventEmitter.listenerCount('error') > 0) {
        this.eventEmitter.emit('error', error);
      } else {
        throw error;
      }
    } else if (message.command === 'notFound') {
      const error = new Error(
        `No window found by background script with ${message.property}: ${message.value}`,
      );
      if (this.eventEmitter.listenerCount('error') > 0) {
        this.eventEmitter.emit('error', error);
      } else {
        throw error;
      }
    }
  }

  // This is not used in the current code, but could be used in the future
  queryTabs(tabTitle: string) {
    this.send({ command: 'queryTabs', title: tabTitle });
  }

  // Sends the message to the Extension, and waits for a response
  async waitUntilWindowWithProperty(property: WindowProperties, value: string) {
    this.send({ command: 'waitUntilWindowWithProperty', property, value });

    const tabs = await this.waitForResponse();
    // console.debug('ServerMochaToBackground got the response', tabs);

    // The return value here is less useful than we had hoped, because the tabs
    // are not in the same order as driver.getAllWindowHandles()
    return tabs;
  }

  async resetFixtureState(strategy: FixtureResetStrategy) {
    const { connectionVersion } = this;
    const id = `fixture-state-reset-${Date.now()}-${Math.random()}`;

    this.send({ command: 'resetFixtureState', id, strategy });

    const response = await this.waitForFixtureStateResetResponse(id);
    if (response.reloadRequired) {
      await this.waitForConnectionAfter(connectionVersion);
    }

    return response;
  }

  async waitForConnectionAfter(connectionVersion: number) {
    if (this.connectionVersion > connectionVersion) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const { eventEmitter } = this;
      const getConnectionVersion = () => this.connectionVersion;
      const timeoutRef: { id?: ReturnType<typeof setTimeout> } = {};

      function onConnection() {
        if (getConnectionVersion() > connectionVersion) {
          eventEmitter.removeListener('connection', onConnection);
          clearTimeout(timeoutRef.id);
          resolve();
        }
      }

      timeoutRef.id = setTimeout(() => {
        eventEmitter.removeListener('connection', onConnection);
        reject(new Error('Timed out waiting for background socket reconnect'));
      }, 30000);

      eventEmitter.on('connection', onConnection);
    });
  }

  async waitForFixtureStateResetResponse(id: string) {
    return new Promise<MessageType>((resolve, reject) => {
      const onResponse = (message: MessageType) => {
        this.eventEmitter.removeListener('error', reject);

        if (message.id === id) {
          resolve(message);
          return;
        }

        reject(
          new Error(`Unexpected fixture state reset response id: ${message.id}`),
        );
      };

      this.eventEmitter.once('error', reject);
      this.eventEmitter.once('fixtureStateReset', onResponse);
    });
  }

  // This is a way to wait for an event async, without timeouts or polling
  async waitForResponse() {
    return new Promise((resolve, reject) => {
      this.eventEmitter.once('error', (error) => {
        this.eventEmitter.removeListener('openTabs', resolve);
        reject(error);
      });
      this.eventEmitter.once('openTabs', (result) => {
        this.eventEmitter.removeListener('error', reject);
        resolve(result);
      });
    });
  }
}

// Singleton setup below
let _serverMochaToBackground: ServerMochaToBackground;

export function getServerMochaToBackground() {
  if (!_serverMochaToBackground) {
    startServerMochaToBackground();
  }

  return _serverMochaToBackground;
}

function startServerMochaToBackground() {
  _serverMochaToBackground = new ServerMochaToBackground();
}
