import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

const getBlockTimestamp = async (rpcUrl, block) => {
  const res = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [`0x${block.toString(16)}`, false],
      id: 1,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return Number.parseInt((await res.json()).result.timestamp, 16) * 1000;
};

export const calculateAverageBlockTimeInMs = async (rpcUrl) => {
  const response = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const NUM_PAST = 5;
  const latestBlock = Number.parseInt((await response.json()).result, 16);
  const latestBlockTimestamp = await getBlockTimestamp(rpcUrl, latestBlock);
  const pastBlockTimestamp = await getBlockTimestamp(
    rpcUrl,
    latestBlock - NUM_PAST,
  );

  return (latestBlockTimestamp - pastBlockTimestamp) / NUM_PAST;
};
