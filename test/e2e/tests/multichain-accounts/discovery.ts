import { Mockttp } from 'mockttp';
import {
  INFURA_MAINNET_URL,
  TEST_SEED_PHRASE,
  TEST_SEED_PHRASE_TWO,
  E2E_SRP,
} from '../../constants';
import { SECOND_TEST_E2E_SRP } from '../../flask/multi-srp/constants';
import {
  IDENTITY_TEAM_SEED_PHRASE,
  IDENTITY_TEAM_SEED_PHRASE_2,
} from '../identity/constants';

// We only mock EVM addresses for discovery, non-EVM discovery is disabled for E2E.
export const TEST_SRPS_TO_MOCKED_DISCOVERED_ACCOUNTS: {
  [srp: string]: string[];
} = {
  [E2E_SRP]: [
    '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
    '0x09781764c08de8ca82e156bbf156a3ca217c7950',
    '0x7de4768c33db8785f75075a054aeeed7e01c4497',
    '0xa870b4e335b9ca39009d0ba50c312562fbef867d',
  ],
  [SECOND_TEST_E2E_SRP]: [
    '0xc6d5a3c98ec9073b54fa0969957bd582e8d874bf',
    '0x59a897a2dbd55d20bcc9b52d5eaa14e2859dc467',
    '0x7d5e716bbc8771af9c5ec3b0555b48a4a84d4ba7',
    '0x8137ec5954a8ed45a90f3bd58f717228b5670858',
  ],
  [TEST_SEED_PHRASE]: [
    '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
    '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59',
    '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
    '0x0bfd76d9e58e31f4f94320460c85b8e4c3148a41',
  ],
  [TEST_SEED_PHRASE_TWO]: [
    '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
    '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
    '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925',
    '0x9c1ba572b1a3012fa279b627ed465198c9bd5f95',
  ],
  [IDENTITY_TEAM_SEED_PHRASE]: [
    '0xaa4179e7f103701e904d27df223a39aa9c27405a',
    '0xd2a4afe5c2ff0a16bf81f77ba4201a8107aa874b',
    '0xd54ba25a07eb3da821face8478c3d965ded63018',
    '0x2c30c098e2a560988d486c7f25798e790802f953',
  ],
  [IDENTITY_TEAM_SEED_PHRASE_2]: [
    '0xc4b422616e8636276b156276ba5a1ade13128442',
    '0x25b08606e82f9530882fc963db25f06a3742df74',
    '0x1d35c1f6f0f66fa194bf74e71f0a9b9e57474bca',
    '0x40edfef353ceaa3bc8466b72c78d855f44e1121e',
  ],
};

function asJsonBody(body: object | undefined) {
  return body ? JSON.stringify(body, null, 2) : '<no-body>';
}

export class MockedDiscoveryBuilder {
  readonly #srp: string;

  readonly #accounts: string[];

  readonly #stopAt: Set<string>;

  readonly #skipGroupIndex: Set<number>;

  #untilGroupIndex?: number;

  #shouldDiscover: boolean;

  constructor(srp: string) {
    this.#srp = srp;
    this.#stopAt = new Set();
    this.#skipGroupIndex = new Set();
    this.#shouldDiscover = true;

    // We need to know about this SRP before going further.
    this.#accounts = TEST_SRPS_TO_MOCKED_DISCOVERED_ACCOUNTS[this.#srp];
    if (this.#accounts === undefined) {
      throw new Error(`Unknown test SRP for discovery (srp="${srp}")`);
    }
    if (!this.#accounts.length) {
      throw new Error(`SRP has no accounts (srp="${srp}")`);
    }
  }

  static from(srp: string): MockedDiscoveryBuilder {
    return new MockedDiscoveryBuilder(srp);
  }

  static fromDefaultSrp(): MockedDiscoveryBuilder {
    return new MockedDiscoveryBuilder(E2E_SRP);
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

  doNotDiscoverAnyAccounts(): MockedDiscoveryBuilder {
    this.#shouldDiscover = false;
    return this;
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

  async mock(mockServer: Mockttp): Promise<void> {
    const srp = this.#srp;
    const accounts = this.#accounts;

    const maxGroupIndex = accounts.length - 1;
    const untilGroupIndex = this.#untilGroupIndex ?? maxGroupIndex;
    if (untilGroupIndex > maxGroupIndex) {
      throw new Error(
        `SRP accounts have a max group index of ${maxGroupIndex}, it cannot go until ${untilGroupIndex} group index (srp="${srp}")`,
      );
    }

    for (const [index, account] of accounts.entries()) {
      const isLastIndex = index === untilGroupIndex;

      const shouldSkip = this.#skipGroupIndex.has(index);
      const shouldDiscover = this.#shouldDiscover;
      const shouldStop = this.#stopAt.has(account) || isLastIndex;

      // We only use EVM to stop the discovery for now.
      if (shouldSkip) {
        continue;
      }

      await this.#mockEvmDiscoveryOnce(
        mockServer,
        account,
        !shouldDiscover || shouldStop,
      );

      if (shouldStop) {
        break;
      }
    }
  }
}
