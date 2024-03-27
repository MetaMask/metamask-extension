import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { BigNumber } from '@ethersproject/bignumber';
import { TransactionType } from '@metamask/transaction-controller';
import * as TokenUtil from '../../../../../shared/lib/token-util';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { shortenAddress } from '../../../../helpers/utils/util';
import ConfirmPageContainer from '.';

const mockOnCancelAll = jest.fn();
const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();
const mockHandleCloseEditGas = jest.fn();

const props = {
  title: 'Title',
  fromAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
  toAddress: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
  origin: 'testOrigin', // required
  // Footer
  onCancelAll: mockOnCancelAll,
  onCancel: mockOnCancel,
  onSubmit: mockOnSubmit,
  handleCloseEditGas: mockHandleCloseEditGas,
  // Gas Popover
  currentTransaction: {
    id: 8783053010106567,
    time: 1656448479005,
    status: 'unapproved',
    chainId: '0x5',
    originalGasEstimate: '0x5208',
    userEditedGasLimit: false,
    loadingDefaults: false,
    dappSuggestedGasFees: null,
    sendFlowHistory: [],
    txParams: {
      from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      to: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
      value: '0x0',
      gas: '0x5208',
      maxFeePerGas: '0x59682f0d',
      maxPriorityFeePerGas: '0x59682f00',
    },
    origin: 'testOrigin',
    type: 'simpleSend',
    userFeeLevel: 'medium',
    defaultGasEstimates: {
      estimateType: 'medium',
      gas: '0x5208',
      maxFeePerGas: '59682f0d',
      maxPriorityFeePerGas: '59682f00',
    },
  },
  isOwnedAccount: false,
  showAccountInHeader: true,
  showEdit: true,
  hideSenderToRecipient: false,
  toName: '0x7a1...E4E8',
  txData: {
    id: 1230035278491151,
    time: 1671022500513,
    status: 'unapproved',
    originalGasEstimate: '0xea60',
    userEditedGasLimit: false,
    chainId: '0x13881',
    loadingDefaults: false,
    dappSuggestedGasFees: {
      gasPrice: '0x4a817c800',
      gas: '0xea60',
    },
    sendFlowHistory: [],
    txParams: {
      from: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
      to: '0x7a67ff4a59594a56d46e9308a5c6e197fa83a3cf',
      value: '0x0',
      data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
      gas: '0xea60',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
    },
    origin: 'https://metamask.github.io',
    type: 'simpleSend',
    history: [
      {
        id: 1230035278491151,
        time: 1671022500513,
        status: 'unapproved',
        originalGasEstimate: '0xea60',
        userEditedGasLimit: false,
        chainId: '0x13881',
        loadingDefaults: true,
        dappSuggestedGasFees: {
          gasPrice: '0x4a817c800',
          gas: '0xea60',
        },
        sendFlowHistory: [],
        txParams: {
          from: '0xdd34b35ca1de17dfcdc07f79ff1f8f94868c40a1',
          to: '0x7a67ff4a59594a56d46e9308a5c6e197fa83a3cf',
          value: '0x0',
          data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
          gas: '0xea60',
          gasPrice: '0x4a817c800',
        },
        origin: 'https://metamask.github.io',
        type: 'simpleSend',
      },
      [
        {
          op: 'remove',
          path: '/txParams/gasPrice',
          note: 'Added new unapproved transaction.',
          timestamp: 1671022501288,
        },
        {
          op: 'add',
          path: '/txParams/maxFeePerGas',
          value: '0x0',
        },
        {
          op: 'add',
          path: '/txParams/maxPriorityFeePerGas',
          value: '0x0',
        },
        {
          op: 'replace',
          path: '/loadingDefaults',
          value: false,
        },
        {
          op: 'add',
          path: '/userFeeLevel',
          value: 'custom',
        },
        {
          op: 'add',
          path: '/defaultGasEstimates',
          value: {
            estimateType: 'custom',
            gas: '0xea60',
            maxFeePerGas: '0',
            maxPriorityFeePerGas: '0',
          },
        },
      ],
    ],
    userFeeLevel: 'custom',
    defaultGasEstimates: {
      estimateType: 'custom',
      gas: '0xea60',
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
    },
  },
};

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() => {
    return Promise.resolve({ chainId: '0x5' });
  }),
  gasFeeStartPollingByNetworkClientId: jest.fn().mockImplementation(() => {
    return Promise.resolve('pollingToken');
  }),
  gasFeeStopPollingByPollingToken: jest.fn(),
  addPollingTokenToAppState: jest.fn(),
}));

jest.mock('../../../../pages/swaps/swaps.util', () => {
  const actual = jest.requireActual('../../../../pages/swaps/swaps.util');
  return {
    ...actual,
    fetchTokenBalance: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../../../../../shared/lib/token-util', () => {
  const actual = jest.requireActual('../../../../../shared/lib/token-util');
  return {
    ...actual,
    fetchTokenBalance: jest.fn(() => Promise.resolve()),
  };
});

const mockedState = jest.mocked(mockState);
const mockedProps = jest.mocked(props);

const setMockedTransactionType = (type) => {
  mockedProps.currentTransaction.type = type;
  mockedProps.txData.type = type;
  mockedProps.txData.history[0].type = type;
};

describe('Confirm Page Container Container Test', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Render and simulate button clicks', () => {
    beforeEach(async () => {
      const store = configureMockStore()(mockedState);
      await act(async () => {
        renderWithProvider(<ConfirmPageContainer {...props} />, store);
      });
    });

    it('should render a confirm page container component', () => {
      const pageContainer = screen.queryByTestId('page-container');
      expect(pageContainer).toBeInTheDocument();
    });

    it('should render navigation', () => {
      const navigationContainer = screen.queryByTestId('navigation-container');
      expect(navigationContainer).toBeInTheDocument();
    });

    it('should render header', () => {
      const headerContainer = screen.queryByTestId('header-container');
      expect(headerContainer).toBeInTheDocument();

      const shortenedFromAddress = shortenAddress(props.fromAddress);
      const headerAddress = screen.queryByTestId('header-address');
      expect(headerAddress).toHaveTextContent(shortenedFromAddress);
    });

    it('should render sender to recipient in header', () => {
      const senderRecipient = screen.queryByTestId('sender-to-recipient');
      expect(senderRecipient).toBeInTheDocument();
    });
    it('should render recipient as address', () => {
      const recipientName = screen.queryByText(shortenAddress(props.toAddress));
      expect(recipientName).toBeInTheDocument();
    });

    it('should simulate click reject button', () => {
      const rejectButton = screen.getByTestId('page-container-footer-cancel');
      fireEvent.click(rejectButton);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should simulate click submit button', () => {
      const confirmButton = screen.getByTestId('page-container-footer-next');
      fireEvent.click(confirmButton);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe(`when type is '${TransactionType.tokenMethodSetApprovalForAll}'`, () => {
    it('should display warning modal with total token balance', async () => {
      const mockValue12AsHexString = '0x0c'; // base-10 representation = 12

      TokenUtil.fetchTokenBalance.mockImplementation(() => {
        return BigNumber.from(mockValue12AsHexString);
      });
      setMockedTransactionType(TransactionType.tokenMethodSetApprovalForAll);
      const store = configureMockStore()(mockedState);

      await act(async () => {
        renderWithProvider(
          <ConfirmPageContainer
            {...props}
            showWarningModal
            assetStandard={TokenStandard.ERC721}
          />,
          store,
        );
      });

      await act(async () => {
        const confirmButton = screen.getByTestId('page-container-footer-next');
        fireEvent.click(confirmButton);
      });

      waitFor(() => {
        expect(
          screen.querySelector('.set-approval-for-all-warning__content'),
        ).toBeDefined();
        expect(screen.queryByText('Total: 12')).toBeInTheDocument();
      });

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rendering NetworkAccountBalanceHeader', () => {
    const store = configureMockStore()(mockState);

    it('should render NetworkAccountBalanceHeader if displayAccountBalanceHeader is true', async () => {
      let result;
      await act(async () => {
        result = renderWithProvider(
          <ConfirmPageContainer {...props} displayAccountBalanceHeader />,
          store,
        );
      });
      const { getByText } = result;
      expect(getByText('Balance')).toBeInTheDocument();
    });

    it('should not render NetworkAccountBalanceHeader if displayAccountBalanceHeader is false', async () => {
      let result;
      await act(async () => {
        result = renderWithProvider(
          <ConfirmPageContainer
            {...props}
            displayAccountBalanceHeader={false}
          />,
          store,
        );
      });
      const { queryByText } = result;
      expect(queryByText('Balance')).toBe(null);
    });
  });

  describe('Contact/AddressBook name should appear in recipient header', () => {
    it('should not show add to address dialog if recipient is in contact list and should display contact name', async () => {
      const addressBookName = 'test save name';

      const addressBook = {
        '0x5': {
          '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8': {
            address: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
            chainId: '054',
            isEns: false,
            memo: '',
            name: addressBookName,
          },
        },
      };

      mockState.metamask.addressBook = addressBook;
      mockState.confirmTransaction.txData.txParams.to =
        '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8';

      const store = configureMockStore()(mockState);

      await act(async () => {
        renderWithProvider(<ConfirmPageContainer {...props} />, store);
      });

      // Does not display new address dialog banner
      const newAccountDetectDialog = screen.queryByText(
        /New address detected!/u,
      );
      expect(newAccountDetectDialog).not.toBeInTheDocument();

      // Shows contact/addressbook name
      const contactName = screen.queryByText(addressBookName);
      expect(contactName).toBeInTheDocument();
    });
  });
});
