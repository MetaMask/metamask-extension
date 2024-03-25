import React from 'react';
import { useSelector } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../../shared/constants/security-provider';
import {
  getNativeCurrency,
  getProviderConfig,
} from '../../../../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
  getCurrentCurrency,
  getMemoizedAddressBook,
  getPreferences,
  getSelectedAccount,
  getTotalUnapprovedMessagesCount,
  getInternalAccounts,
  unconfirmedTransactionsHashSelector,
  getAccountType,
  getMemoizedMetaMaskInternalAccounts,
} from '../../../../selectors';
import SignatureRequest from './signature-request';

const baseProps = {
  clearConfirmTransaction: () => jest.fn(),
  cancel: () => jest.fn(),
  cancelAll: () => jest.fn(),
  showRejectTransactionsConfirmationModal: () => jest.fn(),
  sign: () => jest.fn(),
};
const mockStore = {
  metamask: {
    providerConfig: {
      chainId: '0x539',
      nickname: 'Localhost 8545',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
      type: 'rpc',
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    accounts: {
      '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
        address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        balance: '0x03',
        name: 'John Doe',
      },
    },
    selectedAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'John Doe',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    nativeCurrency: 'ETH',
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionRate: null,
      },
    },
    unapprovedTypedMessagesCount: 2,
  },
};
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: () => jest.fn(),
  };
});

const mockCustodySignFn = jest.fn();

jest.mock('../../../../hooks/useMMICustodySignMessage', () => ({
  useMMICustodySignMessage: () => ({
    custodySignFn: mockCustodySignFn,
  }),
}));

jest.mock('@metamask-institutional/extension');

const generateUseSelectorRouter = (opts) => (selector) => {
  switch (selector) {
    case getProviderConfig:
      return opts.metamask.providerConfig;
    case getCurrentCurrency:
      return opts.metamask.currentCurrency;
    case getNativeCurrency:
      return opts.metamask.providerConfig.ticker;
    case getTotalUnapprovedMessagesCount:
      return opts.metamask.unapprovedTypedMessagesCount;
    case getPreferences:
      return opts.metamask.preferences;
    case conversionRateSelector:
      return opts.metamask.currencyRates[opts.metamask.providerConfig.ticker]
        ?.conversionRate;
    case getSelectedAccount:
      return opts.metamask.accounts[opts.metamask.selectedAddress];
    case getInternalAccounts:
      return Object.values(opts.metamask.internalAccounts.accounts);
    case getMemoizedMetaMaskInternalAccounts:
      return Object.values(opts.metamask.internalAccounts.accounts);
    case getMemoizedAddressBook:
      return [];
    case accountsWithSendEtherInfoSelector:
      return Object.values(opts.metamask.internalAccounts.accounts).map(
        (internalAccount) => {
          return {
            ...internalAccount,
            ...(opts.metamask.accounts[internalAccount.address] ?? {}),
            balance:
              opts.metamask.accounts[internalAccount.address]?.balance ?? 0,
          };
        },
      );
    case getAccountType:
      return 'custody';
    case unconfirmedTransactionsHashSelector:
      return {};
    default:
      return undefined;
  }
};
describe('Signature Request Component', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    let messageData;

    beforeEach(() => {
      useSelector.mockImplementation(generateUseSelectorRouter(mockStore));
      messageData = {
        domain: {
          chainId: 97,
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1',
        },
        message: {
          contents: 'Hello, Bob!',
          from: {
            name: 'Cow',
            wallets: [
              '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
              '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            ],
          },
          to: [
            {
              name: 'Bob',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person[]' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallets', type: 'address[]' },
          ],
        },
      };
    });

    it('should match snapshot when we want to switch to fiat', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            currencyRates: {
              ...mockStore.metamask.currencyRates,
              ETH: {
                ...(mockStore.metamask.currencyRates.ETH || {}),
                conversionRate: 231.06,
              },
            },
          },
        }),
      );
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot when we are using eth', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render navigation', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { queryByTestId } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(queryByTestId('navigation-container')).toBeInTheDocument();
    });

    it('should render a div message parsed without typeless data', () => {
      messageData.message.do_not_display = 'one';
      messageData.message.do_not_display_2 = {
        do_not_display: 'two',
      };
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { queryByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(queryByText('do_not_display')).not.toBeInTheDocument();
      expect(queryByText('one')).not.toBeInTheDocument();
      expect(queryByText('do_not_display_2')).not.toBeInTheDocument();
      expect(queryByText('two')).not.toBeInTheDocument();
    });

    it('should not render a reject multiple requests link if there is not multiple requests', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            unapprovedTypedMessagesCount: 0,
          },
        }),
      );
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(
        container.querySelector('.signature-request__reject-all-button'),
      ).not.toBeInTheDocument();
    });

    it('should render a reject multiple requests link if there is multiple requests (greater than 1)', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(
        container.querySelector('.signature-request__reject-all-button'),
      ).toBeInTheDocument();
    });

    it('should call reject all button when button is clicked', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      const rejectRequestsLink = container.querySelector(
        '.signature-request__reject-all-button',
      );
      fireEvent.click(rejectRequestsLink);
      expect(rejectRequestsLink).toBeDefined();
    });

    it('should render text of reject all button', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      expect(getByText('Reject 2 requests')).toBeInTheDocument();
    });

    it('should render SecurityProviderBannerMessage component properly', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { queryByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous: '?',
              reason: 'Some reason...',
              reason_header: 'Some reason header...',
            },
          }}
        />,
        store,
      );

      expect(queryByText('Request not verified')).toBeInTheDocument();
      expect(
        queryByText(
          'Because of an error, this request was not verified by the security provider. Proceed with caution.',
        ),
      ).toBeInTheDocument();
      expect(queryByText('OpenSea')).toBeInTheDocument();
    });

    it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { queryByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
            },
          }}
        />,
        store,
      );

      expect(queryByText('Request not verified')).toBeNull();
      expect(
        queryByText(
          'Because of an error, this request was not verified by the security provider. Proceed with caution.',
        ),
      ).toBeNull();
      expect(queryByText('OpenSea')).toBeNull();
    });

    it('should render a warning when the selected account is not the one being used to sign', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      useSelector.mockImplementation(
        generateUseSelectorRouter({
          ...mockStore,
          metamask: {
            ...mockStore.metamask,
            selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            accounts: {
              ...mockStore.metamask.accounts,
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                balance: '0x0',
                name: 'Account 1',
              },
              '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
                address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
                balance: '0x0',
                name: 'Account 2',
              },
            },
            internalAccounts: {
              accounts: {
                'b7e813d6-e31c-4bad-8615-8d4eff9f44f1': {
                  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                  id: 'b7e813d6-e31c-4bad-8615-8d4eff9f44f1',
                  metadata: {
                    name: 'Account 1',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Account 2',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'b7e813d6-e31c-4bad-8615-8d4eff9f44f1',
            },
          },
        }),
      );

      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
            },
          }}
        />,
        store,
      );

      expect(
        container.querySelector('.request-signature__mismatch-info'),
      ).toBeInTheDocument();
    });

    it('should display security alert if present', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { getByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          conversionRate={null}
          txData={{
            msgParams,
            securityAlertResponse: {
              resultType: 'Malicious',
              reason: 'blur_farming',
              description:
                'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
              args: {
                contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
                operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
              },
            },
          }}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(getByText('This is a deceptive request')).toBeInTheDocument();
    });

    it('should click onSign with custodyId as a accountType and call custodySignFn', () => {
      const msgParams = {
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { getByTestId } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
        />,
        store,
      );

      const rejectRequestsLink = getByTestId('page-container-footer-next');
      fireEvent.click(rejectRequestsLink);
      expect(mockCustodySignFn).toHaveBeenCalledWith({ msgParams });
    });
  });
});
