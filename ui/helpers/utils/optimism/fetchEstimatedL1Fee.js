import * as ethers from 'ethers';
import * as optimismContracts from '@eth-optimism/contracts';
import buildUnserializedTransaction from './buildUnserializedTransaction';

// The code in this file is largely drawn from https://community.optimism.io/docs/developers/l2/new-fees.html#for-frontend-and-wallet-developers

<<<<<<< HEAD
function buildOVMGasPriceOracleContract(eth) {
  const OVMGasPriceOracle = optimismContracts
    .getContractFactory('OVM_GasPriceOracle')
    .attach(optimismContracts.predeploys.OVM_GasPriceOracle);
  const abi = JSON.parse(
    OVMGasPriceOracle.interface.format(ethers.utils.FormatTypes.json),
=======
// BlockExplorer link: https://optimistic.etherscan.io/address/0x420000000000000000000000000000000000000f#code
const OPTIMISM_GAS_PRICE_ORACLE_ADDRESS =
  '0x420000000000000000000000000000000000000F';

export default async function fetchEstimatedL1Fee(
  chainId,
  txMeta,
  ethersProvider,
) {
  const chainIdAsDecimalNumber = Number(hexToDecimal(chainId));
  const provider =
    ethersProvider ??
    new Web3Provider(global.ethereumProvider, chainIdAsDecimalNumber);

  if (process.env.IN_TEST) {
    provider.detectNetwork = async () => ({
      name: 'optimism',
      chainId: chainIdAsDecimalNumber,
    });
  }
  const contract = new Contract(
    OPTIMISM_GAS_PRICE_ORACLE_ADDRESS,
    OPTIMISM_GAS_PRICE_ORACLE_ABI,
    provider,
>>>>>>> upstream/multichain-swaps-controller
  );
  return eth.contract(abi).at(OVMGasPriceOracle.address);
}

export default async function fetchEstimatedL1Fee(eth, txMeta) {
  const contract = buildOVMGasPriceOracleContract(eth);
  const serializedTransaction = buildUnserializedTransaction(
    txMeta,
  ).serialize();
  const result = await contract.getL1Fee(serializedTransaction);
  return result?.[0]?.toString(16);
}
