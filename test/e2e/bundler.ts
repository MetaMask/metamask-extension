import { startBundler, BundlerServer } from '@metamask/test-bundler';

const BUNDLER_URL = 'http://localhost:3000/rpc';
const CONFIG_FILE = `${__dirname}/bundler.config.json`;

export class Bundler {
  #server: BundlerServer | undefined;

  async start() {
    console.log('Starting bundler');

    try {
      this.#server = await startBundler({
        configFile: CONFIG_FILE,
        unsafe: true,
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
