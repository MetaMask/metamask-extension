import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from './network';
import { existsSync } from 'fs'
import { join } from 'path'

describe('NetworkConstants', () => {
  it('has images files that exist for defined networks', () => {
    for (const [chainId, image] of Object.entries(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP)) {
      if (!existsSync(join('app', image))) {
        throw `Did not find image '${image}' for chain '${chainId}'`;
      }
    }
  });
});
