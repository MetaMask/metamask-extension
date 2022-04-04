import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

const getBlock = async (rpcUrl, block) => {
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

  return (await res.json()).result;
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

  const NUM_PAST = 128;
  const latestBlock = Number.parseInt((await response.json()).result, 16);
  const {timestamp: latestBlockTimestamp, number: latestBlockNumber} = await getBlock(rpcUrl, latestBlock);
  const pastBlock = latestBlock - NUM_PAST;
  const {timestamp: pastBlockTimestamp, number: pastBlockNumber} = await getBlock(
    rpcUrl,
    pastBlock >= 0 ? pastBlock : 0,
  );

  return (latestBlockTimestamp - pastBlockTimestamp) / (latestBlockNumber - pastBlockNumber);
};
