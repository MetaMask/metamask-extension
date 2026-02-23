import { merge, cloneDeep } from 'lodash';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import type {
  TransactionControllerState,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type {
  Preferences,
  PreferencesControllerState,
} from '../../../app/scripts/controllers/preferences-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  SOLANA_MAINNET_SCOPE,
} from '../constants';
import defaultFixtureJson from './default-fixture.json';
import onboardingFixtureJson from './onboarding-fixture.json';

function defaultFixture() {
  return cloneDeep(defaultFixtureJson);
}

function onboardingFixture() {
  return cloneDeep(onboardingFixtureJson);
}

type FixtureType = typeof defaultFixtureJson | typeof onboardingFixtureJson;

type TransactionControllerFixtureInput = Partial<
  Omit<TransactionControllerState, 'transactions'>
> & {
  transactions?: TransactionMeta[];
};

/** networkClientId for localhost (0x539); matches default-fixture.json. */
const LOCALHOST_NETWORK_CLIENT_ID = '3a5eb6f2-cb62-428d-897c-b7ded577d7c2';

class FixtureBuilderV2 {
  fixture: FixtureType;

  /**
   * Constructs a new instance of the FixtureBuilder class.
   *
   * @param options - The options for the constructor.
   * @param options.onboarding - Indicates if onboarding is enabled.
   */
  constructor({ onboarding = false }: { onboarding?: boolean } = {}) {
    this.fixture = onboarding === true ? onboardingFixture() : defaultFixture();
  }

  /* ==================================================================
                          GENERIC  CONTROLLER METHODS
     ==================================================================
  */
  withAddressBookController(data: Partial<AddressBookControllerState>): this {
    if (!this.fixture.data.AddressBookController) {
      (this.fixture.data as Record<string, unknown>).AddressBookController = {
        addressBook: {},
      };
    }
    merge(this.fixture.data.AddressBookController, data);
    return this;
  }

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withPermissionController(
    data: Partial<PermissionControllerState<PermissionConstraint>>,
  ): this {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withTransactionController(data: TransactionControllerFixtureInput): this {
    const transactionController = this.fixture.data.TransactionController ?? {};
    merge(this.fixture.data, { TransactionController: transactionController });
    const target = this.fixture.data
      .TransactionController as Partial<TransactionControllerState>;

    if (data.transactions === undefined) {
      merge(target, data);
    } else {
      const existing = Array.isArray(target.transactions)
        ? target.transactions
        : [];
      const combined: TransactionMeta[] = [
        ...existing,
        ...data.transactions,
      ].sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
      target.transactions = combined;
      // Merge other TransactionController state (lastFetchedBlockNumbers, methodData, etc.)
      // so non-transaction properties are not dropped.
      const { transactions: _dropped, ...rest } = data;
      merge(target, rest);
    }
    return this;
  }

  withPreferencesController(
    data: Omit<Partial<PreferencesControllerState>, 'preferences'> & {
      preferences?: Partial<Preferences>;
    },
  ): this {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
    return this;
  }

  /* ==================================================================
                              CUSTOM METHODS
     ==================================================================
  */
  withTransactionControllerApprovedTransaction(): this {
    const txId = '13a01e77-a368-4bb9-aba9-e7435580e3b9';
    const approvedTx: TransactionMeta = {
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      id: txId,
      origin: 'metamask',
      status: TransactionStatus.approved,
      time: 1617228030067,
      txParams: {
        from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        gas: '0x61a8',
        maxFeePerGas: '0x59682f0c',
        maxPriorityFeePerGas: '0x59682f00',
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        type: '0x2',
        value: '0xde0b6b3a7640000',
      },
      type: TransactionType.simpleSend,
    };
    return this.withTransactionController({ transactions: [approvedTx] });
  }

  withTransactionControllerCompletedTransaction(): this {
    const txId = '0c9342ce-ef3f-4cab-9425-8e57144256a6';
    const completedTx: TransactionMeta = {
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      id: txId,
      origin: 'metamask',
      status: TransactionStatus.confirmed,
      submittedTime: 1671635510753,
      time: 1671635506502,
      txParams: {
        from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        gas: '0x5208',
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        type: '0x2',
        value: '0xde0b6b3a7640000',
      },
      hash: '0xe5e7b95690f584b8f66b33e31acc6184fea553fa6722d42486a59990d13d5fa2',
      blockNumber: '0x7cbf95',
      blockTimestamp: '63a32240',
      txReceipt: {
        blockNumber: '0x7cbf95',
        gasUsed: '5208',
        status: '0x1',
      },
      type: TransactionType.simpleSend,
    };
    return this.withTransactionController({ transactions: [completedTx] });
  }

  withTransactionControllerIncomingTransaction(): this {
    const incomingTx: TransactionMeta = {
      blockNumber: '1',
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
      id: '8a13fd36-fdad-48ae-8b6a-c8991026d550',
      status: TransactionStatus.confirmed,
      time: 1671635520000,
      txParams: {
        from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
        gas: '0x5208',
        gasPrice: '0x329af9707',
        to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        value: '0xDE0B6B3A7640000',
      },
      type: TransactionType.incoming,
    };
    return this.withTransactionController({ transactions: [incomingTx] });
  }

  withTransactionControllerCompletedAndIncomingTransaction(): this {
    return this.withTransactionControllerCompletedTransaction().withTransactionControllerIncomingTransaction();
  }

  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withPermissionControllerConnectedToTestDapp({
    account = '',
    useLocalhostHostname = false,
  }: {
    account?: string;
    useLocalhostHostname?: boolean;
  } = {}): this {
    const selectedAccount = account
      ? account.toLowerCase()
      : DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const dappUrl = useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL;

    // Derive optionalScopes from the EVM networks in state
    const optionalScopes: Record<string, { accounts: string[] }> = {};

    const networkConfigs =
      this.fixture.data.NetworkController?.networkConfigurationsByChainId || {};
    Object.entries(networkConfigs).forEach(([chainIdHex]) => {
      // Convert hex chainId (0x1) to decimal for CAIP-2 format (eip155:1)
      const chainId = parseInt(chainIdHex, 16);
      const scopeKey = `eip155:${chainId}`;
      optionalScopes[scopeKey] = {
        accounts: [`${scopeKey}:${selectedAccount}`],
      };
    });

    // Add Solana Mainnet scope
    optionalScopes[SOLANA_MAINNET_SCOPE] = {
      accounts: [`${SOLANA_MAINNET_SCOPE}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    };

    // Add wallet:eip155 scope
    optionalScopes['wallet:eip155'] = {
      accounts: [],
    };

    return this.withPermissionController({
      subjects: {
        [dappUrl]: {
          origin: dappUrl,
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    isMultichainOrigin: true,
                    optionalScopes,
                    requiredScopes: {},
                    sessionProperties: {},
                  },
                },
              ],
              date: 1770296204693,
              id: 'SFqk8nFLekiqC5O1cYCjT',
              invoker: dappUrl,
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    });
  }

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
