import axios from 'axios';
import log from 'loglevel';

export const Tenderly = {
  Mainnet: {
    name: 'Ethereum Mainnet',
    rpcName: 'Tenderly - Mainnet',
    url: 'https://virtual.mainnet.rpc.tenderly.co/03bb8912-7505-4856-839f-52819a26d0cd',
    chainID: '1',
    symbol: 'ETH',
  },
  Optimism: {
    name: 'OP Mainnet',
    rpcName: '',
    url: 'https://virtual.optimism.rpc.tenderly.co/3170a58e-fa67-4ccc-9697-b13aff0f5c1a',
    chainID: '10',
    symbol: 'ETH',
  },
  Polygon: {
    name: 'Polygon',
    rpcName: '',
    url: 'https://virtual.polygon.rpc.tenderly.co/e834a81e-69ba-49e9-a6a5-be5b6eea3cdc',
    chainID: '137',
    symbol: 'ETH',
  },
};

export async function addFundsToAccount(
  rpcURL: string,
  account: string,
  amount: string = '0xDE0B6B3A7640000', // 1 ETH by default
) {
  const data = {
    jsonrpc: '2.0',
    method: 'tenderly_setBalance',
    params: [[account], amount],
    id: '1234',
  };
  const response = await axios.post(rpcURL, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.data.error) {
    log.error(
      `\tERROR: RROR: Failed to add funds to Tenderly VirtualTestNet\n${response.data.error}`,
    );
  }
}
