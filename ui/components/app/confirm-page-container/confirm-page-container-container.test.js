import React from 'react';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import SenderToRecipient from '../../ui/sender-to-recipient';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import Dialog from '../../ui/dialog';
import ConfirmPageContainer, {
  ConfirmPageContainerHeader,
  ConfirmPageContainerNavigation,
} from '.';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

describe('Confirm Page Container Container Test', () => {
  let wrapper;

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      accounts: {
        '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
          address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
          balance: '0x03',
        },
      },
      cachedBalances: {},
      selectedAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      addressBook: [],
      chainId: 'test',
      identities: [],
      featureFlags: {},
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
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
    currentTransaction: {},
    showAddToAddressBookModal: sinon.spy(),
    contact: undefined,
    isOwnedAccount: false,
  };

  beforeAll(() => {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <ConfirmPageContainer.WrappedComponent {...props} />,
      </Provider>,
      store,
    );
  });

  it('should render a confirm page container component', () => {
    const pageContainer = wrapper.find('.page-container');
    expect(pageContainer).toHaveLength(1);
    expect(pageContainer.getElements()[0].props.className).toStrictEqual(
      'page-container',
    );
  });

  it('should render navigation', () => {
    expect(wrapper.find(ConfirmPageContainerNavigation)).toHaveLength(1);
  });

  it('should render header', () => {
    expect(wrapper.find(ConfirmPageContainerHeader)).toHaveLength(1);
    expect(
      wrapper.find(ConfirmPageContainerHeader).getElements()[0].props
        .accountAddress,
    ).toStrictEqual('0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5');
  });

  it('should render sender to recipient in header', () => {
    expect(wrapper.find(SenderToRecipient)).toHaveLength(1);
    expect(
      wrapper.find(SenderToRecipient).getElements()[0].props.senderAddress,
    ).toStrictEqual('0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5');
    expect(
      wrapper.find(SenderToRecipient).getElements()[0].props.recipientAddress,
    ).toStrictEqual('0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8');
  });

  it('should render recipient as address', () => {
    const recipientWithAddress = wrapper.find(
      '.sender-to-recipient__party--recipient-with-address',
    );
    expect(recipientWithAddress).toHaveLength(1);

    expect(wrapper.find('.sender-to-recipient__name')).toHaveLength(2);
  });

  it('should render add address to address book dialog', () => {
    expect(wrapper.find(Dialog)).toHaveLength(1);
    expect(wrapper.find(Dialog).getElements()[0].props.children).toStrictEqual(
      'newAccountDetectedDialogMessage',
    );
  });

  it('should simulate click on Dialog', () => {
    const DialogWrapper = wrapper.find(Dialog);
    DialogWrapper.first().simulate('click');
    expect(props.showAddToAddressBookModal.calledOnce).toStrictEqual(true);
  });

  it('should not show add to address dialog if contact is not undefined', () => {
    props.contact = {
      address: '0x7a1A4Ad9cc746a70ee58568466f7996dD0aCE4E8',
      name: 'test saved name',
      isEns: false,
      chainId: 'test',
    };

    const wrapper2 = mountWithRouter(
      <Provider store={store}>
        <ConfirmPageContainer.WrappedComponent {...props} />,
      </Provider>,
      store,
    );

    expect(wrapper2.find(Dialog)).toHaveLength(0);
  });

  it('should render recipient as name', () => {
    const wrapper2 = mountWithRouter(
      <Provider store={store}>
        <ConfirmPageContainer.WrappedComponent {...props} />,
      </Provider>,
      store,
    );

    const recipientWithAddress = wrapper2.find(
      '.sender-to-recipient__party--recipient-with-address',
    );
    expect(recipientWithAddress).toHaveLength(1);

    expect(wrapper.find('.sender-to-recipient__name')).toHaveLength(2);
  });

  it('should simulate click reject button', () => {
    expect(wrapper.find('button.page-container__footer-button')).toHaveLength(
      2,
    );
    wrapper
      .find('button.page-container__footer-button')
      .first()
      .simulate('click');
    expect(props.onCancel.calledOnce).toStrictEqual(true);
  });

  it('should simulate click submit button', () => {
    expect(wrapper.find('button.page-container__footer-button')).toHaveLength(
      2,
    );
    wrapper
      .find('button.page-container__footer-button')
      .at(1)
      .simulate('click');
    expect(props.onSubmit.calledOnce).toStrictEqual(true);
  });
});
