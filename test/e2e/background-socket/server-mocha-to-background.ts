import events from 'events';
import { WebSocketServer } from 'ws';
import {
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

  private eventEmitter;

  // Reconnection properties
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private intentionalDisconnect: boolean = false;

  constructor() {
    this.server = new WebSocketServer({ port: 8111 });

    console.debug('ServerMochaToBackground created');

    this.setupConnectionHandler();

    this.eventEmitter = new events.EventEmitter<ServerMochaEventEmitterType>();
  }

  // This function is never explicitly called, but in the future it could be
  stop() {
    // Mark this as an intentional disconnect to prevent automatic reconnection
    this.intentionalDisconnect = true;

    // Clear any reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close the WebSocket connection
    this.ws?.close();

    // Close the server
    this.server.close();

    console.debug('ServerMochaToBackground stopped');
  }

  // Send a message to the Extension background script (service worker in MV3)
  send(message: MessageType) {
    if (!this.ws) {
      console.warn(
        'No client connected to ServerMochaToBackground, message not sent:',
        message,
      );

      // If we're not actively attempting to reconnect and there's no intentional disconnect,
      // trigger a reconnection attempt
      if (
        !this.reconnectTimer &&
        !this.intentionalDisconnect &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        console.log('Attempting to reconnect before sending message...');
        this.handleReconnect();
      }

      throw new Error('No client connected to ServerMochaToBackground');
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);

      // If the connection is broken, try to reconnect
      if (!this.reconnectTimer && !this.intentionalDisconnect) {
        console.log('Connection error detected, attempting to reconnect...');
        this.ws = null; // Reset the connection
        this.handleReconnect();
      }

      throw error;
    }
  }

  // Handle messages received from the Extension background script (service worker in MV3)
  private receivedMessage(message: MessageType) {
    if (message.command === 'openTabs' && message.tabs) {
      this.eventEmitter.emit('openTabs', message.tabs);
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

  // Set up the connection handler for the WebSocket server
  private setupConnectionHandler() {
    this.server.on('connection', (ws: WebSocket) => {
      // Check for existing connection and close it
      if (this.ws) {
        console.error(
          'ServerMochaToBackground got a second client connection, closing the first one',
        );
        this.ws.close();
      }

      this.ws = ws;

      // Reset reconnection parameters on successful connection
      this.resetReconnection();

      console.debug('ServerMochaToBackground got a client connection');

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

      ws.onclose = (ev) => {
        this.ws = null;
        console.debug('ServerMochaToBackground disconnected from client');
        this.handleReconnect();
      };

      ws.onerror = (error) => {
        console.error('ServerMochaToBackground WebSocket error:', error);

        // If we encounter an error and we're not already trying to reconnect,
        // initiate a reconnection attempt
        if (!this.reconnectTimer && !this.intentionalDisconnect) {
          console.debug('WebSocket error detected, attempting to reconnect...');
          this.handleReconnect();
        }
      };
    });
  }

  // Reset reconnection parameters after successful connection
  private resetReconnection() {
    if (this.reconnectAttempts > 0) {
      console.debug(
        `ServerMochaToBackground: Connection re-established after ${this.reconnectAttempts} attempt(s)`,
      );
    }

    this.reconnectAttempts = 0;
    this.intentionalDisconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Handle reconnection logic
  private handleReconnect() {
    if (
      this.intentionalDisconnect ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn(
          `ServerMochaToBackground: Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
        );
      }
      return;
    }

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts++;

    // Calculate exponential backoff delay (1s, 2s, 4s, 8s, 16s)
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting to ServerMochaToBackground: attempt ${this.reconnectAttempts} (delay: ${delay}ms)`,
    );

    this.reconnectTimer = setTimeout(() => {
      // Close the existing server and create a new one
      this.server.close();
      this.server = new WebSocketServer({ port: 8111 });

      console.debug(
        'ServerMochaToBackground server restarted, waiting for client connection...',
      );

      // Re-attach connection event handler
      this.setupConnectionHandler();
    }, delay);
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
