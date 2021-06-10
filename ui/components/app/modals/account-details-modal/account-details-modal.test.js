import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import AccountDetailsModal from './account-details-modal.container';

describe('Account Details Modal', () => {
  let wrapper;

  global.platform = { openTab: sinon.spy() };

  const props = {
    hideModal: sinon.spy(),
    setAccountLabel: sinon.spy(),
    showExportPrivateKeyModal: sinon.spy(),
    network: 'test',
    rpcPrefs: {},
    selectedIdentity: {
      address: '0xAddress',
      name: 'Account 1',
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0xAddress'],
      },
    ],
    identities: {
      '0xAddress': {
        address: '0xAddress',
        name: 'Account 1',
      },
    },
  };

  beforeEach(() => {
    wrapper = shallow(<AccountDetailsModal.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  it('sets account label when changing default account label', () => {
    const accountLabel = wrapper.find('.account-details-modal__name').first();
    accountLabel.simulate('submit', 'New Label');

    expect(props.setAccountLabel.calledOnce).toStrictEqual(true);
    expect(props.setAccountLabel.getCall(0).args[1]).toStrictEqual('New Label');
  });

  it('opens new tab when view block explorer is clicked', () => {
    const modalButton = wrapper.find('.account-details-modal__button');
    const etherscanLink = modalButton.first();

    etherscanLink.simulate('click');
    expect(global.platform.openTab.calledOnce).toStrictEqual(true);
  });

  it('shows export private key modal when clicked', () => {
    const modalButton = wrapper.find('.account-details-modal__button');
    const etherscanLink = modalButton.last();

    etherscanLink.simulate('click');
    expect(props.showExportPrivateKeyModal.calledOnce).toStrictEqual(true);
  });

  it('sets blockexplorerview text when block explorer url in rpcPrefs exists', () => {
    const blockExplorerUrl = 'https://block.explorer';
    wrapper.setProps({ rpcPrefs: { blockExplorerUrl } });

    const modalButton = wrapper.find('.account-details-modal__button');
    const blockExplorerLink = modalButton.first().shallow();

    expect(blockExplorerLink.text()).toStrictEqual('blockExplorerView');
  });
});
