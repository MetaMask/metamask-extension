import axios from 'axios';

export const Tenderly = {
  Mainnet: {
    name: 'Ethereum',
    rpcName: 'Tenderly - Mainnet',
    url: 'https://virtual.mainnet.rpc.tenderly.co/6a1cf1d8-3625-4ba0-b07e-c620d326ecb9',
    chainID: '0x1',
    symbol: 'ETH',
  },
  Optimism: {
    name: 'OP',
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
  Linea: {
    name: 'Linea',
    rpcName: '',
    url: 'https://virtual.linea.rpc.tenderly.co/76ec2678-5c4e-4cd8-baa0-8d3dea738645',
    chainID: '0xe708',
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

  return response.data;
}
