const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { isManifestV3 } = require('../../../shared/modules/mv3.utils');

describe('Add Ethereum Chain', function () {
  describe('the dapp is not already permitted to use the chain being added', () => {
    it('automatically permits and switches to the chain when the rpc endpoint is added and no rpc endpoint previously existed for the chain', async function () { });


    it('automatically permits and switches to the chain when the rpc endpoint is added but a different rpc endpoint already existed for the chain', async function () {
    });

    it('prompts to switch to the chain when the rpc endpoint being added already exists', async function () {
    });
  })

  describe('the dapp is already permitted to use the chain being added', () => {
    it('automatically switches to the chain when the rpc endpoint is added and no rpc endpoint previously existed for the chain', async function () { });

    it('automatically switches to the chain when the rpc endpoint is added but a different rpc endpoint already existed for the chain', async function () {
    });

    it('automatically switches to the chain when the rpc endpoint being added already exists for the chain', async function () {
    });
  })
});
