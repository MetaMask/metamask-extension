import React from 'react';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { shortenAddress } from '../../../helpers/utils/util';
import ConfirmPageContainer from '.';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

jest.mock('../../../pages/swaps/swaps.util', () => {
  const actual = jest.requireActual('../../../pages/swaps/swaps.util');
  return {
    ...actual,
    fetchTokenBalance: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../../../selectors', () => {
  return {
    ...jest.requireActual('../../../selectors/'),
    getTxData: jest.fn(() => ({
      id: 1230035278491151,
      time: 1671022500513,
      status: 'unapproved',
      metamaskNetworkId: '80001',
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
          metamaskNetworkId: '80001',
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
    })),
  };
});

describe('Confirm Page Container Container Test', () => {
  const props = {
    title: 'Title',
    fromAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    toAddress: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
    origin: 'testOrigin', // required
    // Footer
    onCancelAll: sinon.spy(),
    onCancel: sinon.spy(),
    onSubmit: sinon.spy(),
    handleCloseEditGas: sinon.spy(),
    // Gas Popover
    currentTransaction: {
      id: 8783053010106567,
      time: 1656448479005,
      status: 'unapproved',
      metamaskNetworkId: '5',
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
  };
  describe('Render and simulate button clicks', () => {
    const store = configureMockStore()(mockState);
    beforeEach(() => {
      renderWithProvider(<ConfirmPageContainer {...props} />, store);
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
      expect(props.onCancel.calledOnce).toStrictEqual(true);
    });

    it('should simulate click submit button', () => {
      const confirmButton = screen.getByTestId('page-container-footer-next');
      fireEvent.click(confirmButton);
      expect(props.onSubmit.calledOnce).toStrictEqual(true);
    });
  });

  describe('Contact/AddressBook name should appear in recipient header', () => {
    it('should not show add to address dialog if recipient is in contact list and should display contact name', () => {
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

      const store = configureMockStore()(mockState);

      renderWithProvider(<ConfirmPageContainer {...props} />, store);

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
