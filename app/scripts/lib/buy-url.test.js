import nock from 'nock';
import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  ETH_SYMBOL,
  BUYABLE_CHAINS_MAP,
} from '../../../shared/constants/network';
import { TRANSAK_API_KEY, MOONPAY_API_KEY } from '../constants/on-ramp';
import { SWAPS_API_V2_BASE_URL } from '../../../shared/constants/swaps';
import getBuyUrl from './buy-url';

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
const BSC = {
  chainId: BSC_CHAIN_ID,
  amount: 5,
  address: ETH_ADDRESS,
};
const POLYGON = {
  chainId: POLYGON_CHAIN_ID,
  amount: 5,
  address: ETH_ADDRESS,
};

describe('buy-url', () => {
  it('returns Wyre url with an ETH address for Ethereum mainnet', async () => {
    nock(SWAPS_API_V2_BASE_URL)
      .get(
        `/networks/1/fiatOnRampUrl?serviceName=wyre&destinationAddress=${ETH_ADDRESS}`,
      )
      .reply(200, {
        url: `https://pay.sendwyre.com/purchase?accountId=${WYRE_ACCOUNT_ID}&utm_campaign=${WYRE_ACCOUNT_ID}&destCurrency=${ETH_SYMBOL}&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A${ETH_ADDRESS}&utm_source=checkout`,
      });
    const wyreUrl = await getBuyUrl(MAINNET);
    expect(wyreUrl).toStrictEqual(
      `https://pay.sendwyre.com/purchase?accountId=${WYRE_ACCOUNT_ID}&utm_campaign=${WYRE_ACCOUNT_ID}&destCurrency=${ETH_SYMBOL}&utm_medium=widget&paymentMethod=debit-card&reservation=MLZVUF8FMXZUMARJC23B&dest=ethereum%3A${ETH_ADDRESS}&utm_source=checkout`,
    );
    nock.cleanAll();
  });

  it('returns a fallback Wyre url if /orders/reserve API call fails', async () => {
    const wyreUrl = await getBuyUrl(MAINNET);

    expect(wyreUrl).toStrictEqual(
      `https://pay.sendwyre.com/purchase?dest=ethereum:${ETH_ADDRESS}&destCurrency=${ETH_SYMBOL}&accountId=${WYRE_ACCOUNT_ID}&paymentMethod=debit-card`,
    );
  });

  it('returns Transak url with an ETH address for Ethereum mainnet', async () => {
    const transakUrl = await getBuyUrl({ ...MAINNET, service: 'transak' });
    const buyableChain = BUYABLE_CHAINS_MAP[MAINNET.chainId];
    const buyableCurrencies = encodeURIComponent(
      buyableChain.transakCurrencies.join(','),
    );

    expect(transakUrl).toStrictEqual(
      `https://global.transak.com/?apiKey=${TRANSAK_API_KEY}&hostURL=https%3A%2F%2Fmetamask.io&cryptoCurrencyList=${buyableCurrencies}&defaultCryptoCurrency=${buyableChain.transakCurrencies[0]}&networks=${buyableChain.network}&walletAddress=${ETH_ADDRESS}`,
    );
  });

  it('returns Transak url with an BNB address for Binance Smart Chain', async () => {
    const transakUrl = await getBuyUrl({ ...BSC, service: 'transak' });
    const buyableChain = BUYABLE_CHAINS_MAP[BSC.chainId];
    const buyableCurrencies = encodeURIComponent(
      buyableChain.transakCurrencies.join(','),
    );

    expect(transakUrl).toStrictEqual(
      `https://global.transak.com/?apiKey=${TRANSAK_API_KEY}&hostURL=https%3A%2F%2Fmetamask.io&cryptoCurrencyList=${buyableCurrencies}&defaultCryptoCurrency=${buyableChain.transakCurrencies[0]}&networks=${buyableChain.network}&walletAddress=${ETH_ADDRESS}`,
    );
  });

  it('returns Transak url with an MATIC address for Polygon', async () => {
    const transakUrl = await getBuyUrl({ ...POLYGON, service: 'transak' });
    const buyableChain = BUYABLE_CHAINS_MAP[POLYGON.chainId];
    const buyableCurrencies = encodeURIComponent(
      buyableChain.transakCurrencies.join(','),
    );

    expect(transakUrl).toStrictEqual(
      `https://global.transak.com/?apiKey=${TRANSAK_API_KEY}&hostURL=https%3A%2F%2Fmetamask.io&cryptoCurrencyList=${buyableCurrencies}&defaultCryptoCurrency=${buyableChain.transakCurrencies[0]}&networks=${buyableChain.network}&walletAddress=${ETH_ADDRESS}`,
    );
  });

  it('returns metamask ropsten faucet for network 3', async () => {
    const ropstenUrl = await getBuyUrl(ROPSTEN);
    expect(ropstenUrl).toStrictEqual('https://faucet.metamask.io/');
  });

  it('returns rinkeby dapp for network 4', async () => {
    const rinkebyUrl = await getBuyUrl(RINKEBY);
    expect(rinkebyUrl).toStrictEqual('https://www.rinkeby.io/');
  });

  it('returns kovan github test faucet for network 42', async () => {
    const kovanUrl = await getBuyUrl(KOVAN);
    expect(kovanUrl).toStrictEqual('https://github.com/kovan-testnet/faucet');
  });

  it('returns a MoonPay url with a prefilled wallet address for the Ethereum network', async () => {
    const {
      moonPay: { defaultCurrencyCode, showOnlyCurrencies } = {},
    } = BUYABLE_CHAINS_MAP[MAINNET.chainId];
    const moonPayQueryParams = new URLSearchParams({
      apiKey: MOONPAY_API_KEY,
      walletAddress: MAINNET.address,
      defaultCurrencyCode,
      showOnlyCurrencies,
    });
    const queryParams = new URLSearchParams({
      url: `https://buy.moonpay.com?${moonPayQueryParams}`,
      context: 'extension',
    });
    nock(SWAPS_API_V2_BASE_URL)
      .get(`/moonpaySign/?${queryParams}`)
      .reply(200, {
        url: `https://buy.moonpay.com/?apiKey=${MOONPAY_API_KEY}&walletAddress=${MAINNET.address}&defaultCurrencyCode=${defaultCurrencyCode}&showOnlyCurrencies=eth%2Cusdt%2Cusdc%2Cdai&signature=laefTlgkESEc2hv8AZEH9F25VjLEJUADY27D6MccE54%3D`,
      });
    const moonPayUrl = await getBuyUrl({ ...MAINNET, service: 'moonpay' });
    expect(moonPayUrl).toStrictEqual(
      `https://buy.moonpay.com/?apiKey=${MOONPAY_API_KEY}&walletAddress=${MAINNET.address}&defaultCurrencyCode=${defaultCurrencyCode}&showOnlyCurrencies=eth%2Cusdt%2Cusdc%2Cdai&signature=laefTlgkESEc2hv8AZEH9F25VjLEJUADY27D6MccE54%3D`,
    );
    nock.cleanAll();
  });

  it('returns an empty string if generating a MoonPay url fails', async () => {
    const moonPayUrl = await getBuyUrl({ ...MAINNET, service: 'moonpay' });
    expect(moonPayUrl).toStrictEqual('');
  });
});
