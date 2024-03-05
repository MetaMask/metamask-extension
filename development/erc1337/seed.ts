import {
  ContractFactory,
  Contract,
  ContractInterface,
} from '@ethersproject/contracts';
import { BytesLike } from '@metamask/utils';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
  entrypointAbi,
  entrypointBytecode,
} from '../../test/e2e/seeder/contracts/entrypoint';
import {
  simpleAccountFactoryAbi,
  simpleAccountFactoryBytecode,
} from '../../test/e2e/seeder/contracts/simpleAccountFactory';
import {
  verifyingPaymasterAbi,
  verifyingPaymasterBytecode,
} from '../../test/e2e/seeder/contracts/verifyingPaymaster';

const provider = new JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner(0);

async function deployContract(
  abi: ContractInterface,
  bytecode: BytesLike,
  ...initArgs: any[]
): Promise<Contract> {
  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(...initArgs);
  return contract;
}

async function main() {
  const entrypoint = await deployContract(entrypointAbi, entrypointBytecode);
  const simpleAccountFactory = await deployContract(
    simpleAccountFactoryAbi,
    simpleAccountFactoryBytecode,
    entrypoint.address,
  );
  const verifyingPaymaster = await deployContract(
    verifyingPaymasterAbi,
    verifyingPaymasterBytecode,
    entrypoint.address,
    await signer.getAddress(),
  );
  console.log({
    signerAddress: await signer.getAddress(),
    entrypoint: entrypoint.address,
    simpleAccountFactory: simpleAccountFactory.address,
    verifyingPaymaster: verifyingPaymaster.address,
  });
}

main();
