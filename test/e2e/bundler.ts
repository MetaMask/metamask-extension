import { startBundler, BundlerServer } from '@metamask/test-bundler';

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
}
