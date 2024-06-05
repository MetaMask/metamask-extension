import { startBundler, BundlerServer } from '@metamask/test-bundler';
import { BUNDLER_URL } from './constants';

const CONFIG_FILE = `${__dirname}/bundler.config.json`;

export class Bundler {
  #server: BundlerServer | undefined;

  #userOperationHashes: string[] = [];

  async start() {
    console.log('Starting bundler');

    try {
      this.#server = await startBundler({
        configFile: CONFIG_FILE,
        unsafe: true,
      });

      this.#server.hub.on('user-operation-added', (userOperationHash) => {
        this.#userOperationHashes.push(userOperationHash);
      });

      await this.#server.asyncStart();
    } catch (e) {
      console.log('Failed to start bundler', e);
      throw e;
    }

    console.log('Started bundler');
  }

  async stop() {
    if (!this.#server) {
      throw new Error('Bundler not running');
    }

    try {
      await this.#server.stop();
    } catch (e) {
      console.log('Error while stopping bundler', e);
    }
  }

  getUserOperationHashes(): string[] {
    return this.#userOperationHashes;
  }

  async getUserOperationReceipt(userOperationHash: string) {
    const response = await fetch(BUNDLER_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOperationHash],
      }),
    });

    return (await response.json()).result;
  }
}
