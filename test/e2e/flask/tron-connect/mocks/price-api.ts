import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';

export const mockExchangeRates = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/spot-prices`)
    .withQuery({
      vsCurrency: 'usd',
      assetIds:
        'tron:728126428/slip44:195,tron:3448148188/slip44:195,tron:2494104990/slip44:195',
    })
    .thenJson(200, {
      'tron:728126428/slip44:195': {
        id: 'tron',
        price: 0.27989,
        marketCap: 26501571090,
        allTimeHigh: 0.431288,
        allTimeLow: 0.00180434,
        totalVolume: 584039469,
        high1d: 0.281458,
        low1d: 0.278801,
        circulatingSupply: 94683395974.3822,
        dilutedMarketCap: 26501570979,
        marketCapPercentChange1d: -0.25,
        priceChange1d: -0.000716844753300194,
        pricePercentChange1h: 0.357582350741983,
        pricePercentChange1d: -0.255462049152282,
        pricePercentChange7d: 0.862835815143018,
        pricePercentChange14d: 0.395394234400669,
        pricePercentChange30d: -4.69037102835574,
        pricePercentChange200d: 4.7347558395209,
        pricePercentChange1y: -1.29971018156079,
      },
      'tron:3448148188/slip44:195': null,
      'tron:2494104990/slip44:195': null,
    });

export const mockExchangeRatesV1 = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v1/exchange-rates`)
    .withQuery({
      baseCurrency: 'usd',
    })
    .thenJson(200, exchangeRatesV1);

export const mockHistoricalPrices1d = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/historical-prices/tron:728126428/slip44:195`)
    .withQuery({
      timePeriod: '1d',
      vsCurrency: 'usd',
    })
    .thenJson(200, historicalPrices1d);

export const mockHistoricalPrices7d = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/historical-prices/tron:728126428/slip44:195`)
    .withQuery({
      timePeriod: '7d',
      vsCurrency: 'usd',
    })
    .thenJson(200, historicalPrices7d);

const historicalPrices1d = {
  prices: [
    [1765907123637, 0.280626127831253],
    [1765907440876, 0.280570163696151],
    [1765907731559, 0.28059437479581],
    [1765908318934, 0.280505137251374],
    [1765908511491, 0.280490864680171],
    [1765908639840, 0.280487781521585],
    [1765908987532, 0.280527935305779],
    [1765909260659, 0.280561722053657],
    [1765909548942, 0.280637899165565],
    [1765909924391, 0.280657165196107],
  ],
  marketCaps: [
    [1765907123637, 26575276923.1885],
    [1765907440876, 26564792620.4621],
    [1765907731559, 26564792620.4621],
    [1765908318934, 26565365511.9709],
    [1765908511491, 26565365511.9709],
    [1765908639840, 26565365511.9709],
    [1765908987532, 26565365511.9709],
    [1765909260659, 26561516998.9781],
    [1765909548942, 26561516998.9781],
    [1765909924391, 26561516998.9781],
  ],
  totalVolumes: [
    [1765907123637, 626528640.188989],
    [1765907440876, 626986064.919585],
    [1765907731559, 614043608.236183],
    [1765908318934, 614622710.050275],
    [1765908511491, 613956707.450721],
    [1765908639840, 614092675.228785],
    [1765908987532, 611266139.352625],
    [1765909260659, 600633391.333043],
    [1765909548942, 609500071.688516],
    [1765909924391, 601629689.057957],
  ],
};

const historicalPrices7d = {
  prices: [
    [1765389694031, 0.277039795901075],
    [1765393286951, 0.277761445840328],
    [1765396875984, 0.278573518322504],
    [1765400487657, 0.279959118313456],
    [1765404033419, 0.280544863858019],
    [1765407702948, 0.279836460099204],
    [1765411297990, 0.280147328059563],
    [1765414867358, 0.279613278071429],
    [1765418493934, 0.27879668105408],
    [1765422173298, 0.278525748779846],
  ],
  marketCaps: [
    [1765389694031, 26238709915.47],
    [1765393286951, 26294315073.5492],
    [1765396875984, 26376422538.5454],
    [1765400487657, 26515593774.5646],
    [1765404033419, 26561775299.0296],
    [1765407702948, 26491526328.4378],
    [1765411297990, 26526418603.8561],
    [1765414867358, 26489108762.449],
    [1765418493934, 26397199355.577],
    [1765422173298, 26379966171.5641],
  ],
  totalVolumes: [
    [1765389694031, 547418167.266959],
    [1765393286951, 610320837.194207],
    [1765396875984, 632134730.285097],
    [1765400487657, 669928002.668241],
    [1765404033419, 676893167.278428],
    [1765407702948, 665130014.350754],
    [1765411297990, 658239366.768665],
    [1765414867358, 664352283.261472],
    [1765418493934, 689153010.391872],
    [1765422173298, 702513336.843355],
  ],
};

const exchangeRatesV1 = {
  btc: {
    name: 'Bitcoin',
    ticker: 'btc',
    value: 0.000011553382153844,
    currencyType: 'crypto',
  },
  eth: {
    name: 'Ether',
    ticker: 'eth',
    value: 0.000350460294254708,
    currencyType: 'crypto',
  },
  usd: {
    name: 'US Dollar',
    ticker: 'usd',
    value: 1,
    currencyType: 'fiat',
  },
  trx: {
    name: 'Tron',
    ticker: 'trx',
    value: 3.57770104624172,
    currencyType: 'crypto',
  },
};
