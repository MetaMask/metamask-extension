import { Mockttp } from 'mockttp';
import { ACCOUNT_TYPE, INFURA_MAINNET_URL } from '../../constants';
import { SOLANA_URL_REGEX_MAINNET } from '../solana/common-solana';
import { E2E_SRP } from '../../default-fixture';
import { SECOND_TEST_E2E_SRP } from '../../flask/multi-srp/common-multi-srp';

export type MockedDiscoveredAccount = {
  [ACCOUNT_TYPE.Ethereum]: string;
  [ACCOUNT_TYPE.Solana]: string;
};

export const TEST_SRPS_TO_MOCKED_DISCOVERED_ACCOUNTS: {
  [srp: string]: MockedDiscoveredAccount[];
} = {
  [E2E_SRP]: [
    {
      [ACCOUNT_TYPE.Ethereum]: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      [ACCOUNT_TYPE.Solana]: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
      [ACCOUNT_TYPE.Solana]: 'ExTE8W1KuMHod2EihdQPeD8mdC87Rg9UJh2FASmbGNtt',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0x7de4768c33db8785f75075a054aeeed7e01c4497',
      [ACCOUNT_TYPE.Solana]: '4knGGsvpPWjyC6MxpRqNwfh6UfN19DdhAiE2ZWqBbqLd',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0xa870b4e335b9ca39009d0ba50c312562fbef867d',
      [ACCOUNT_TYPE.Solana]: '9JaUkPErzbn9ZGbrjyiEPWG8VVixN81UsH9wXMyVAqNs',
    },
  ],
  [SECOND_TEST_E2E_SRP]: [
    {
      [ACCOUNT_TYPE.Ethereum]: '0xc6d5a3c98ec9073b54fa0969957bd582e8d874bf',
      [ACCOUNT_TYPE.Solana]: 'CYWSQQ2iiFL6EZzuqvMM9o22CZX3N8PowvvkpBXqLK4e',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0x59a897a2dbd55d20bcc9b52d5eaa14e2859dc467',
      [ACCOUNT_TYPE.Solana]: '5R8a8GBd971kg5B5FqisVmVRk6ooFYtsh1y7vCHNvRvf',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0x7d5e716bbc8771af9c5ec3b0555b48a4a84d4ba7',
      [ACCOUNT_TYPE.Solana]: '24iMjt1Z1Ga9menNQKyrCcknGCf6oQSTHUpzsLNK1Tas',
    },
    {
      [ACCOUNT_TYPE.Ethereum]: '0x8137ec5954a8ed45a90f3bd58f717228b5670858',
      [ACCOUNT_TYPE.Solana]: 'AeHVnxJ4GnXXgqz3ZY8FXXRJyNW7Cb4A1uLeRf4b74Jh',
    },
  ],
};

function asJsonBody(body: object | undefined) {
  return body ? JSON.stringify(body, null, 2) : '<no-body>';
}

export class MockedDiscoveryBuilder {
  readonly #srp: string;

  readonly #stopAt: Set<string>;

  readonly #skipGroupIndex: Set<number>;

  #untilGroupIndex?: number;

  constructor(srp: string) {
    this.#srp = srp;
    this.#stopAt = new Set();
    this.#skipGroupIndex = new Set();
  }

  static from(srp: string): MockedDiscoveryBuilder {
    return new MockedDiscoveryBuilder(srp);
  }

  stopAt(address: string): MockedDiscoveryBuilder {
    this.#stopAt.add(address);
    return this;
  }

  skipGroupIndex(groupIndex: number): MockedDiscoveryBuilder {
    this.#skipGroupIndex.add(groupIndex);
    return this;
  }

  skipDefaultGroupIndex(): MockedDiscoveryBuilder {
    return this.skipGroupIndex(0);
  }

  fromGroupIndex(groupIndex: number): MockedDiscoveryBuilder {
    for (let i = 0; i < groupIndex; i++) {
      this.#skipGroupIndex.add(i);
    }
    return this;
  }

  untilGroupIndex(groupIndex: number): MockedDiscoveryBuilder {
    this.#untilGroupIndex = groupIndex;
    return this;
  }

  async #mockEvmDiscoveryOnce(
    mockServer: Mockttp,
    address: string,
    shouldStop: boolean = false,
  ) {
    console.log(
      `Mocking EVM discovery request for: "${address}"${shouldStop ? ' (shouldStop)' : ''}`,
    );
    return await mockServer
      .forPost(INFURA_MAINNET_URL)
      .once()
      .withJsonBodyIncluding({
        method: 'eth_getTransactionCount',
      })
      .withBodyIncluding(address)
      .once()
      .thenCallback(async (request) => {
        const json = await request.body.getJson();
        console.log(
          `Mocked EVM discovery request for: "${address}" -> ${asJsonBody(json)}`,
        );

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1',
            result: shouldStop ? '0x0' : '0x1',
          },
        };
      });
  }

  async #mockSolDiscoveryOnce(mockServer: Mockttp, address: string) {
    console.log(`Mocking SOL discovery request for: "${address}"`);
    return await mockServer
      .forPost(SOLANA_URL_REGEX_MAINNET)
      .withJsonBodyIncluding({
        method: 'getSignaturesForAddress',
      })
      .withBodyIncluding(address)
      .once()
      .thenCallback(async (request) => {
        const json = await request.body.getJson();
        console.log(
          `Mocked SOL discovery request for: "${address}" -> ${asJsonBody(json)}`,
        );

        return {
          statusCode: 200,
          json: {
            id: '1',
            jsonrpc: '2.0',
            // NOTE: For now, Solana discovery is not returning anything, and we mainly
            // rely on the EVM one for custom logic. Though, we still need to mock those
            // network requests regardless.
            result: [],
          },
        };
      });
  }

  async mock(mockServer: Mockttp): Promise<void> {
    const srp = this.#srp;
    const accounts = TEST_SRPS_TO_MOCKED_DISCOVERED_ACCOUNTS[this.#srp];

    if (accounts === undefined) {
      throw new Error(`Unknown test SRP for discovery (srp="${srp}")`);
    }

    if (!accounts.length) {
      throw new Error(`SRP has no accounts (srp="${srp}")`);
    }

    const maxGroupIndex = accounts.length - 1;
    const untilGroupIndex = this.#untilGroupIndex ?? maxGroupIndex;
    if (untilGroupIndex > maxGroupIndex) {
      throw new Error(
        `SRP accounts have a max group index of ${maxGroupIndex}, it cannot go until ${untilGroupIndex} group index (srp="${srp}")`,
      );
    }

    for (const [index, account] of accounts.entries()) {
      const evmAddress = account[ACCOUNT_TYPE.Ethereum];
      const solAddress = account[ACCOUNT_TYPE.Solana];

      const shouldSkip = this.#skipGroupIndex.has(index);
      const shouldStop =
        this.#stopAt.has(evmAddress) || index === untilGroupIndex;

      // We only use EVM to stop the discovery for now.
      if (!shouldSkip) {
        await this.#mockEvmDiscoveryOnce(mockServer, evmAddress, shouldStop);
        await this.#mockSolDiscoveryOnce(mockServer, solAddress);
      }

      if (shouldStop) {
        break;
      }
    }
  }
}
