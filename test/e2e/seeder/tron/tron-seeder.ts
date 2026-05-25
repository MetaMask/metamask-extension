import type {
  TronTrc20Symbol,
  TronTrc20Token,
  TronLocalNodeOptions,
} from './assets';
import {
  type TronSmartContract,
  TRON_SMART_CONTRACTS,
} from './smart-contracts';

type TronSeederNode = {
  deployTrc20Token: (
    symbol: TronTrc20Symbol,
    initialSupply?: string,
  ) => Promise<TronTrc20Token>;
  recordTrc20Balance: (
    address: string,
    symbol: TronTrc20Symbol,
    amount: string,
  ) => void;
  transferTrc20Token: (
    token: TronTrc20Token,
    toAddress: string,
    amount: string,
  ) => Promise<void>;
  trc20Tokens: Partial<Record<TronTrc20Symbol, TronTrc20Token>>;
};

type TronDeployOptions = {
  initialSupply?: string;
};

type StoredContract = {
  address: string;
  name: TronSmartContract;
};

class TronContractAddressRegistry {
  readonly #contracts: StoredContract[] = [];

  getAllDeployedContractAddresses(): string[] {
    return this.#contracts.map((contract) => contract.address);
  }

  getContractAddress(contractName: TronSmartContract): string | undefined {
    const matchingContracts = this.#contracts.filter(
      (contract) => contract.name === contractName,
    );
    return matchingContracts.at(-1)?.address;
  }

  storeNewContractAddress(
    contractName: TronSmartContract,
    contractAddress: string,
  ): void {
    this.#contracts.push({
      address: contractAddress,
      name: contractName,
    });
  }
}

export class TronSeeder {
  readonly #contractRegistry = new TronContractAddressRegistry();

  readonly #node: TronSeederNode;

  constructor(node: TronSeederNode) {
    this.#node = node;
  }

  async deploySmartContract(
    contractName: TronSmartContract,
    deployOptions: TronDeployOptions = {},
  ): Promise<string> {
    const existingToken = this.#node.trc20Tokens[contractName];
    if (existingToken) {
      this.storeSmartContractAddress(contractName, existingToken.address);
      return existingToken.address;
    }

    const token = await this.#node.deployTrc20Token(
      contractName,
      deployOptions.initialSupply,
    );
    this.storeSmartContractAddress(contractName, token.address);
    return token.address;
  }

  getContractRegistry(): TronContractAddressRegistry {
    return this.#contractRegistry;
  }

  async seedSmartContractBalances(
    balancesByAddress: NonNullable<TronLocalNodeOptions['trc20Balances']>,
  ): Promise<void> {
    const totals = getTokenTotals(balancesByAddress);

    for (const symbol of Object.keys(totals) as TronTrc20Symbol[]) {
      await this.deploySmartContract(TRON_SMART_CONTRACTS[symbol], {
        initialSupply: totals[symbol],
      });
      const token = this.#node.trc20Tokens[symbol];
      if (!token) {
        throw new Error(`TRC20 contract ${symbol} was not deployed`);
      }

      for (const [address, balances] of Object.entries(balancesByAddress)) {
        const amount = balances[symbol];
        if (amount) {
          await this.#node.transferTrc20Token(token, address, amount);
          this.#node.recordTrc20Balance(address, symbol, amount);
        }
      }
    }
  }

  storeSmartContractAddress(
    contractName: TronSmartContract,
    contractAddress: string,
  ): void {
    this.#contractRegistry.storeNewContractAddress(
      contractName,
      contractAddress,
    );
  }
}

function getTokenTotals(
  balancesByAddress: NonNullable<TronLocalNodeOptions['trc20Balances']>,
): Partial<Record<TronTrc20Symbol, string>> {
  const totals: Partial<Record<TronTrc20Symbol, string>> = {};
  for (const balances of Object.values(balancesByAddress)) {
    for (const [symbol, amount] of Object.entries(balances) as [
      TronTrc20Symbol,
      string,
    ][]) {
      totals[symbol] = (
        BigInt(totals[symbol] ?? '0') + BigInt(amount)
      ).toString();
    }
  }

  return totals;
}
