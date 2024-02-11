import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import buildUnserializedTransaction from '../buildUnserializedTransaction';

// Snippet of the ABI that we need -- matches OP
// If needed for reference, contract if available here:
// https://github.com/scroll-tech/scroll/blob/develop/contracts/src/L2/predeploys/IL1GasPriceOracle.sol
const SCROLL_GAS_PRICE_ORACLE_ABI = [
  {
    inputs: [{ internalType: 'bytes', name: '_data', type: 'bytes' }],
    name: 'getL1Fee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// BlockExplorer link: https://scrollscan.com/address/0x5300000000000000000000000000000000000002#code
const SCROLL_GAS_PRICE_ORACLE_ADDRESS =
  '0x5300000000000000000000000000000000000002';

/**
 * Fetches the estimated L1 fee for the transaction by calling Scroll L1 Gas Oracle.
 *
 * @param chainId - The id of the chain we're calculating the L1 fee for
 * @param txMeta - Metadata of the transaction
 * @param ethersProvider - Ethers provider used for interacting with the Oracles
 */
export default async function fetchEstimatedL1Fee(
  chainId,
  txMeta,
  ethersProvider,
) {
  const chainIdAsDecimalNumber = Number(hexToDecimal(chainId));
  const provider = global.ethereumProvider
    ? new Web3Provider(global.ethereumProvider, chainIdAsDecimalNumber)
    : ethersProvider;

  if (process.env.IN_TEST) {
    provider.detectNetwork = async () => ({
      name: 'scroll',
      chainId: chainIdAsDecimalNumber,
    });
  }
  const contract = new Contract(
    SCROLL_GAS_PRICE_ORACLE_ADDRESS,
    SCROLL_GAS_PRICE_ORACLE_ABI,
    provider,
  );
  const serializedTransaction = buildUnserializedTransaction(
    txMeta,
    true,
  ).serialize();
  const result = await contract.getL1Fee(serializedTransaction);

  return result?.toHexString();
}
