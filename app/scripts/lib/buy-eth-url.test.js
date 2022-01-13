import nock from 'nock';
import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import { TRANSAK_API_KEY } from '../constants/on-ramp';
import { SWAPS_API_V2_BASE_URL } from '../../../shared/constants/swaps';
import getBuyEthUrl from './buy-eth-url';

const WYRE_ACCOUNT_ID = 'AC-7AG3W4XH4N2';
const ETH_ADDRESS = '0x0dcd5d886577d5581b0c524242ef2ee70be3e7bc';
const MAINNET = {
  chainId: MAINNET_CHAIN_ID,
  amount: 5,
  address: ETH_ADDRESS,
};
const ROPSTEN = {
  chainId: ROPSTEN_CHAIN_ID,
};
const RINKEBY = {
  chainId: RINKEBY_CHAIN_ID,
};
const KOVAN = {
  chainId: KOVAN_CHAIN_ID,
};

describe('buy-eth-url', () => {
  it('returns Wyre url with an ETH address for Ethereum mainnet', async () => {
    nock(SWAPS_API_V2_BASE_URL)
      .get(
        `/networks/1/fiatOnRampUrl?serviceName=wyre&destinationAddress=${ETH_ADDRESS}`,
      )
      .reply(200, {
        url: `https://pay.sendwyre.com/purchase?accountId=${WYRE_ACCOUNT_ID}&utm_campaign=${WYRE_ACCOUNT_ID}&destCurrency=ETH&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A${ETH_ADDRESS}&utm_source=checkout`,
      });
    const wyreUrl = await getBuyEthUrl(MAINNET);
    expect(wyreUrl).toStrictEqual(
      `https://pay.sendwyre.com/purchase?accountId=${WYRE_ACCOUNT_ID}&utm_campaign=${WYRE_ACCOUNT_ID}&destCurrency=ETH&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A${ETH_ADDRESS}&utm_source=checkout`,
    );
    nock.cleanAll();
  });

  it('returns a fallback Wyre url if /orders/reserve API call fails', async () => {
    const wyreUrl = await getBuyEthUrl(MAINNET);

    expect(wyreUrl).toStrictEqual(
      `https://pay.sendwyre.com/purchase?dest=ethereum:${ETH_ADDRESS}&destCurrency=ETH&accountId=${WYRE_ACCOUNT_ID}&paymentMethod=debit-card`,
    );
  });

  it('returns Transak url with an ETH address for Ethereum mainnet', async () => {
    const transakUrl = await getBuyEthUrl({ ...MAINNET, service: 'transak' });

    expect(transakUrl).toStrictEqual(
      `https://global.transak.com/?apiKey=${TRANSAK_API_KEY}&hostURL=https%3A%2F%2Fmetamask.io&defaultCryptoCurrency=ETH&walletAddress=${ETH_ADDRESS}`,
    );
  });

  it('returns metamask ropsten faucet for network 3', async () => {
    const ropstenUrl = await getBuyEthUrl(ROPSTEN);
    expect(ropstenUrl).toStrictEqual('https://faucet.metamask.io/');
  });

  it('returns rinkeby dapp for network 4', async () => {
    const rinkebyUrl = await getBuyEthUrl(RINKEBY);
    expect(rinkebyUrl).toStrictEqual('https://www.rinkeby.io/');
  });

  it('returns kovan github test faucet for network 42', async () => {
    const kovanUrl = await getBuyEthUrl(KOVAN);
    expect(kovanUrl).toStrictEqual('https://github.com/kovan-testnet/faucet');
  });
});
