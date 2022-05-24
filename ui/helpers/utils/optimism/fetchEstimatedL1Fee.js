import * as ethers from 'ethers';
import { getContractFactory } from '@eth-optimism/contracts/dist/contract-defs';
import { predeploys } from '@eth-optimism/contracts/dist/predeploys';
import buildUnserializedTransaction from './buildUnserializedTransaction';

// The code in this file is largely drawn from https://community.optimism.io/docs/developers/l2/new-fees.html#for-frontend-and-wallet-developers

function buildOVMGasPriceOracleContract(eth) {
  const OVMGasPriceOracle = getContractFactory('OVM_GasPriceOracle').attach(
    predeploys.OVM_GasPriceOracle,
  );
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
