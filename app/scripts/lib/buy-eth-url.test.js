import { strict as assert } from 'assert';
import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import { TRANSAK_API_KEY } from '../constants/on-ramp';
import getBuyEthUrl from './buy-eth-url';

describe('buy-eth-url', function () {
  const mainnet = {
    chainId: MAINNET_CHAIN_ID,
    amount: 5,
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  };
  const ropsten = {
    chainId: ROPSTEN_CHAIN_ID,
  };
  const rinkeby = {
    chainId: RINKEBY_CHAIN_ID,
  };
  const kovan = {
    chainId: KOVAN_CHAIN_ID,
  };

  it('returns Wyre url with an ETH address for Ethereum mainnet', function () {
    const wyreUrl = getBuyEthUrl(mainnet);

    assert.equal(
      wyreUrl,
      'https://pay.sendwyre.com/purchase?dest=ethereum:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc&destCurrency=ETH&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card',
    );
  });

  it('returns Transak url with an ETH address for Ethereum mainnet', function () {
    const transakUrl = getBuyEthUrl({ ...mainnet, service: 'transak' });

    assert.equal(
      transakUrl,
      `https://global.transak.com/?apiKey=${TRANSAK_API_KEY}&hostURL=https%3A%2F%2Fmetamask.io&defaultCryptoCurrency=ETH&walletAddress=0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc`,
    );
  });

  it('returns metamask ropsten faucet for network 3', function () {
    const ropstenUrl = getBuyEthUrl(ropsten);
    assert.equal(ropstenUrl, 'https://faucet.metamask.io/');
  });

  it('returns rinkeby dapp for network 4', function () {
    const rinkebyUrl = getBuyEthUrl(rinkeby);
    assert.equal(rinkebyUrl, 'https://www.rinkeby.io/');
  });

  it('returns kovan github test faucet for network 42', function () {
    const kovanUrl = getBuyEthUrl(kovan);
    assert.equal(kovanUrl, 'https://github.com/kovan-testnet/faucet');
  });
});
