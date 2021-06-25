import { strict as assert } from 'assert';
import nock from 'nock';
import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import getBuyEthUrl from './buy-eth-url';

describe('buy-eth-url', function () {
  const mainnet = {
    chainId: MAINNET_CHAIN_ID,
    amount: 5,
    address: '0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc',
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

  it('returns a Wyre url with an order reservation ID', async function () {
    nock('https://api.metaswap.codefi.network')
      .get(
        '/fiatOnRampUrl?serviceName=wyre&destinationAddress=0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc',
      )
      .reply(200, {
        url:
          'https://pay.sendwyre.com/purchase?accountId=AC-7AG3W4XH4N2&utm_campaign=AC-7AG3W4XH4N2&destCurrency=ETH&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc&utm_source=checkout&paymentMethod=debit-card',
      });
    const wyreUrl = await getBuyEthUrl(mainnet);
    assert.equal(
      wyreUrl,
      'https://pay.sendwyre.com/purchase?accountId=AC-7AG3W4XH4N2&utm_campaign=AC-7AG3W4XH4N2&destCurrency=ETH&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc&utm_source=checkout&paymentMethod=debit-card',
    );
    nock.cleanAll();
  });

  it('returns a fallback Wyre url if /orders/reserve API call fails', async function () {
    const wyreUrl = await getBuyEthUrl(mainnet);

    assert.equal(
      wyreUrl,
      'https://pay.sendwyre.com/purchase?dest=ethereum:0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc&destCurrency=ETH&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card',
    );
  });

  it('returns metamask ropsten faucet for network 3', async function () {
    const ropstenUrl = await getBuyEthUrl(ropsten);
    assert.equal(ropstenUrl, 'https://faucet.metamask.io/');
  });

  it('returns rinkeby dapp for network 4', async function () {
    const rinkebyUrl = await getBuyEthUrl(rinkeby);
    assert.equal(rinkebyUrl, 'https://www.rinkeby.io/');
  });

  it('returns kovan github test faucet for network 42', async function () {
    const kovanUrl = await getBuyEthUrl(kovan);
    assert.equal(kovanUrl, 'https://github.com/kovan-testnet/faucet');
  });
});
