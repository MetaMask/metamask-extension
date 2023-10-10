const LocalMessageDuplexStream = require('post-message-stream')
import Capnode, { streamFromRemote } from 'capnode';
const pump = require('pump')
const log = require('loglevel')

const WALLET_INITIATION_EVENT = 'Web3Wallet-Request';
const WALLET_RESPONSE_EVENT = 'Web3Wallet-Response';

const origin = '*' // window.location.origin;

const capnode = new Capnode({})
const remote = capnode.createRemote();
const capStream = streamFromRemote(remote);

module.exports = function setupCapnode (extensionMux) {

  window.addEventListener('message', setupPublicApiV2);

  async function setupPublicApiV2 (event) {
		const msg = event.data;

		if (typeof msg !== 'object') return
		if (msg.direction !== 'from-page-script') return
		if (!msg.message) return
		if (msg.message !== WALLET_INITIATION_EVENT) return;
		if (event.origin !== window.location.origin) return;

		let backgroundCapStream;
		if (extensionMux._substreams['cap']) {
			backgroundCapStream = extensionMux._substreams['cap'];
		} else {
			backgroundCapStream = extensionMux.createStream('cap')
		}

    pump(
      capStream,
      backgroundCapStream,
      capStream,
      (err) => {
        // report any error
        if (err) log.error(err)
      }
    )

    console.log('requesting index')
    const index = await capnode.requestIndex(remote);

/**
 Only works on firefox:
		const clonedIndex = Components.utils.cloneInto(index, window, {
			cloneFunctions: true,
		});
		window.capnodeIndex = clonedIndex;
**/

		const detail = {
			hello: 'World',
			number: BigInt(1),
		  uint8Arr: new Uint8Array(5),
		}
		const customEvent = new CustomEvent(WALLET_RESPONSE_EVENT, { detail });
		console.log('dispatching ', customEvent);
		window.dispatchEvent(customEvent);
  }
}

