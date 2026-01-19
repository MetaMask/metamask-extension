import type { Anvil } from '../../seeder/anvil';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const AnvilSeeder = require('../../seeder/anvil-seeder');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

export const SMART_CONTRACT_NAMES = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
] as const;

export type SmartContractName = (typeof SMART_CONTRACT_NAMES)[number];

export type Hardfork =
  | 'frontier'
  | 'homestead'
  | 'dao'
  | 'tangerine'
  | 'spuriousDragon'
  | 'byzantium'
  | 'constantinople'
  | 'petersburg'
  | 'istanbul'
  | 'muirGlacier'
  | 'berlin'
  | 'london'
  | 'arrowGlacier'
  | 'grayGlacier'
  | 'paris'
  | 'shanghai'
  | 'prague';

export type DeployerOptions = {
  fromAddress?: string;
  fromPrivateKey?: string;
};

export type DeployContractOptions = {
  deployerOptions?: DeployerOptions;
  hardfork?: Hardfork;
};

export type DeployedContract = {
  name: SmartContractName;
  address: string;
  deployedAt: string;
};

/**
 * TypeScript wrapper around the existing JS AnvilSeeder for MCP server integration.
 * Provides typed contract deployment and tracking for LLM agents.
 */
export class AnvilSeederWrapper {
  private seeder: InstanceType<typeof AnvilSeeder>;

  private deployedContracts: Map<SmartContractName, DeployedContract> =
    new Map();

  private defaultHardfork: Hardfork = 'prague';

  constructor(provider: ReturnType<Anvil['getProvider']>) {
    this.seeder = new AnvilSeeder(provider);
  }

  /**
   * Deploy a single smart contract to Anvil.
   *
   * @param name - The contract name to deploy
   * @param options - Optional deployment options (hardfork, deployer)
   * @returns The deployed contract information
   */
  async deployContract(
    name: SmartContractName,
    options: DeployContractOptions = {},
  ): Promise<DeployedContract> {
    const hardfork = options.hardfork ?? this.defaultHardfork;

    const contractKeyMap: Record<SmartContractName, string> = {
      hst: SMART_CONTRACTS.HST,
      nfts: SMART_CONTRACTS.NFTS,
      erc1155: SMART_CONTRACTS.ERC1155,
      piggybank: SMART_CONTRACTS.PIGGYBANK,
      failing: SMART_CONTRACTS.FAILING,
      multisig: SMART_CONTRACTS.MULTISIG,
      entrypoint: SMART_CONTRACTS.ENTRYPOINT,
      simpleAccountFactory: SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY,
      verifyingPaymaster: SMART_CONTRACTS.VERIFYING_PAYMASTER,
    };

    const contractKey = contractKeyMap[name];

    if (!contractKey) {
      throw new Error(`Unknown contract: ${name}`);
    }

    await this.seeder.deploySmartContract(
      contractKey,
      hardfork,
      options.deployerOptions,
    );

    const address = this.seeder
      .getContractRegistry()
      .getContractAddress(contractKey);

    const deployed: DeployedContract = {
      name,
      address,
      deployedAt: new Date().toISOString(),
    };

    this.deployedContracts.set(name, deployed);
    return deployed;
  }

  /**
   * Deploy multiple smart contracts in sequence.
   *
   * @param names - Array of contract names to deploy
   * @param options - Optional deployment options
   * @returns Object with deployed and failed contracts
   */
  async deployContracts(
    names: SmartContractName[],
    options: DeployContractOptions = {},
  ): Promise<{
    deployed: DeployedContract[];
    failed: { name: string; error: string }[];
  }> {
    const deployed: DeployedContract[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const name of names) {
      try {
        const contract = await this.deployContract(name, options);
        deployed.push(contract);
      } catch (error) {
        failed.push({
          name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { deployed, failed };
  }

  /**
   * Get the deployed address of a contract.
   *
   * @param name - The contract name to look up
   * @returns The contract address or null if not deployed
   */
  getContractAddress(name: SmartContractName): string | null {
    return this.deployedContracts.get(name)?.address ?? null;
  }

  /**
   * Get all deployed contracts in this session.
   *
   * @returns Array of deployed contract information
   */
  getDeployedContracts(): DeployedContract[] {
    return Array.from(this.deployedContracts.values());
  }

  /**
   * Transfer ETH to an address.
   *
   * @param to - Recipient address
   * @param valueWei - Amount in wei
   */
  async transfer(to: string, valueWei: bigint): Promise<void> {
    await this.seeder.transfer(to, `0x${valueWei.toString(16)}`);
  }

  /**
   * Deposit funds to the verifying paymaster.
   *
   * @param amountWei - Amount in wei
   */
  async paymasterDeposit(amountWei: bigint): Promise<void> {
    await this.seeder.paymasterDeposit(`0x${amountWei.toString(16)}`);
  }

  /**
   * Clear the deployed contracts registry.
   * Called during cleanup.
   */
  clearRegistry(): void {
    this.deployedContracts.clear();
  }
}
