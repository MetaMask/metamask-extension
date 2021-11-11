import * as ethers from 'ethers';
import * as optimismContracts from '@eth-optimism/contracts';
import buildUnserializedTransaction from './buildUnserializedTransaction';

// The code in this file is largely drawn from https://community.optimism.io/docs/developers/l2/new-fees.html#for-frontend-and-wallet-developers

function buildOVMGasPriceOracleContract(eth) {
  const OVMGasPriceOracle = optimismContracts
    .getContractFactory('OVM_GasPriceOracle')
    .attach(optimismContracts.predeploys.OVM_GasPriceOracle);
  const abi = JSON.parse(
    OVMGasPriceOracle.interface.format(ethers.utils.FormatTypes.json),
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
