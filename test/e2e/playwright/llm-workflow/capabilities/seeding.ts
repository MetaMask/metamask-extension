import type {
  ContractSeedingCapability,
  ContractDeployment,
  ContractInfo,
  DeployOptions,
} from '@metamask/metamask-mcp-core';
import {
  AnvilSeederWrapper,
  type SmartContractName,
  type DeployContractOptions,
} from '../anvil-seeder-wrapper';
import type { MetaMaskChainCapability } from './chain';

export const AVAILABLE_CONTRACTS: SmartContractName[] = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
];

export type MetaMaskContractSeedingCapabilityOptions = {
  chainCapability: MetaMaskChainCapability;
};

export class MetaMaskContractSeedingCapability
  implements ContractSeedingCapability
{
  private seeder: AnvilSeederWrapper | undefined;

  private readonly chainCapability: MetaMaskChainCapability;

  constructor(options: MetaMaskContractSeedingCapabilityOptions) {
    this.chainCapability = options.chainCapability;
  }

  initialize(): void {
    const anvil = this.chainCapability.getAnvil();
    if (!anvil) {
      throw new Error(
        'Chain capability not initialized. Call chain.start() first.',
      );
    }

    const provider = anvil.getProvider();
    this.seeder = new AnvilSeederWrapper(provider);
  }

  getSeeder(): AnvilSeederWrapper {
    if (!this.seeder) {
      throw new Error(
        'Seeder not initialized. Call initialize() after chain.start().',
      );
    }
    return this.seeder;
  }

  async deployContract(
    name: string,
    options?: DeployOptions,
  ): Promise<ContractDeployment> {
    if (!this.seeder) {
      throw new Error(
        'Seeder not initialized. Call initialize() after chain.start().',
      );
    }

    const contractName = name as SmartContractName;
    if (!AVAILABLE_CONTRACTS.includes(contractName)) {
      throw new Error(
        `Unknown contract: ${name}. Available contracts: ${AVAILABLE_CONTRACTS.join(', ')}`,
      );
    }

    const deployOptions: DeployContractOptions = {};
    if (options?.hardfork) {
      deployOptions.hardfork =
        options.hardfork as DeployContractOptions['hardfork'];
    }
    if (options?.deployerOptions) {
      deployOptions.deployerOptions = options.deployerOptions;
    }

    const deployed = await this.seeder.deployContract(
      contractName,
      deployOptions,
    );

    return {
      name: deployed.name,
      address: deployed.address,
      deployedAt: deployed.deployedAt,
    };
  }

  async deployContracts(
    names: string[],
    options?: DeployOptions,
  ): Promise<{
    deployed: ContractDeployment[];
    failed: { name: string; error: string }[];
  }> {
    if (!this.seeder) {
      throw new Error(
        'Seeder not initialized. Call initialize() after chain.start().',
      );
    }

    const contractNames = names as SmartContractName[];
    const deployOptions: DeployContractOptions = {};
    if (options?.hardfork) {
      deployOptions.hardfork =
        options.hardfork as DeployContractOptions['hardfork'];
    }

    const result = await this.seeder.deployContracts(
      contractNames,
      deployOptions,
    );

    return {
      deployed: result.deployed.map((d) => ({
        name: d.name,
        address: d.address,
        deployedAt: d.deployedAt,
      })),
      failed: result.failed,
    };
  }

  getContractAddress(name: string): string | null {
    if (!this.seeder) {
      throw new Error(
        'Seeder not initialized. Call initialize() after chain.start().',
      );
    }

    return this.seeder.getContractAddress(name as SmartContractName);
  }

  listDeployedContracts(): ContractInfo[] {
    if (!this.seeder) {
      throw new Error(
        'Seeder not initialized. Call initialize() after chain.start().',
      );
    }

    return this.seeder.getDeployedContracts().map((d) => ({
      name: d.name,
      address: d.address,
      deployedAt: d.deployedAt,
    }));
  }

  getAvailableContracts(): string[] {
    return [...AVAILABLE_CONTRACTS];
  }

  clearRegistry(): void {
    if (this.seeder) {
      this.seeder.clearRegistry();
    }
  }
}
