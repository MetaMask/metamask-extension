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

describe('Confirm Page Container Container Test', () => {
  const props = {
    title: 'Title',
    fromAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    toAddress: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
    origin: 'testOrigin', // required
    onNextTx: sinon.spy(),
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
      metamaskNetworkId: '4',
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

    it('should render add address to address book dialog', () => {
      const newAccountDetectDialog = screen.queryByText(
        /New address detected!/u,
      );
      expect(newAccountDetectDialog).toBeInTheDocument();
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
        '0x4': {
          '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8': {
            address: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
            chainId: '0x4',
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
