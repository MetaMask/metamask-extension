import axios from 'axios';

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
  Abritrum: {
    name: 'Arbitrum One',
    rpcName: '',
    url: 'https://virtual.arbitrum.rpc.tenderly.co/7d364996-41a7-4da6-a552-a19ab1ef9173',
    chainID: '42161',
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
    // eslint-disable-next-line no-console
    console.log(
      `ERROR: Failed to add funds to Tenderly VirtualTestNet\n${response.data.error}`,
    );
  }
}
