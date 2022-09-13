import React from 'react';
import { shallow } from 'enzyme';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import Dialog from '../../../components/ui/dialog';
import SendContent from './send-content.component';

import SendAmountRow from './send-amount-row/send-amount-row.container';
import SendHexDataRow from './send-hex-data-row/send-hex-data-row.container';
import SendAssetRow from './send-asset-row/send-asset-row.container';

describe('SendContent Component', () => {
  let wrapper;

  const defaultProps = {
    showHexData: true,
    gasIsExcessive: false,
    networkAndAccountSupports1559: true,
    asset: { type: 'NATIVE' },
    recipient: {
      mode: 'CONTACT_LIST',
      userInput: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
      address: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
      nickname: 'John Doe',
      error: null,
      warning: null,
    },
    tokenAddressList: {
      '0x32e6c34cd57087abbd59b5a4aecc4cb495924356': {
        name: 'BitBase',
        symbol: 'BTBS',
        decimals: 18,
        address: '0x32E6C34Cd57087aBBD59B5A4AECC4cB495924356',
        iconUrl: 'BTBS.svg',
        occurrences: null,
      },
      '0x3fa400483487a489ec9b1db29c4129063eec4654': {
        name: 'Cryptokek.com',
        symbol: 'KEK',
        decimals: 18,
        address: '0x3fa400483487A489EC9b1dB29C4129063EEC4654',
        iconUrl: 'cryptokek.svg',
        occurrences: null,
      },
    },
  };

  beforeEach(() => {
    wrapper = shallow(<SendContent {...defaultProps} />, {
      context: { t: (str) => `${str}_t` },
    });
  });

  describe('render', () => {
    it('should render a PageContainerContent component', () => {
      expect(wrapper.find(PageContainerContent)).toHaveLength(1);
    });

    it('should render a div with a .send-v2__form class as a child of PageContainerContent', () => {
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.is('div')).toStrictEqual(true);
      expect(PageContainerContentChild.is('.send-v2__form')).toStrictEqual(
        true,
      );
    });

    it('should render the correct row components as grandchildren of the PageContainerContent component', () => {
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.childAt(0).is(Dialog)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(1).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(2).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(3).is(SendHexDataRow),
      ).toStrictEqual(true);
    });

    it('should not render the SendHexDataRow if props.showHexData is false', () => {
      wrapper.setProps({ showHexData: false });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.childAt(0).is(Dialog)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(1).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(2).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(SendHexDataRow)).toHaveLength(0);
    });

    it('should not render the SendHexDataRow if the asset type is TOKEN (ERC-20)', () => {
      wrapper.setProps({ asset: { type: 'TOKEN' } });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.childAt(0).is(Dialog)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(1).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(2).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(SendHexDataRow)).toHaveLength(0);
    });

    it('should not render the Dialog if contact has a name', () => {
      wrapper.setProps({
        showHexData: false,
        contact: { name: 'testName' },
      });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(
        PageContainerContentChild.childAt(0).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(1).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(Dialog)).toHaveLength(0);
    });

    it('should not render the Dialog if it is an ownedAccount', () => {
      wrapper.setProps({
        showHexData: false,
        isOwnedAccount: true,
      });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(
        PageContainerContentChild.childAt(0).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(1).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(Dialog)).toHaveLength(0);
    });

    it('should render insufficient gas dialog', () => {
      wrapper.setProps({
        showHexData: false,
        getIsBalanceInsufficient: true,
      });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      const errorDialogProps = PageContainerContentChild.childAt(0).props();
      expect(errorDialogProps.className).toStrictEqual('send__error-dialog');
      expect(errorDialogProps.children).toStrictEqual(
        'insufficientFundsForGas_t',
      );
    });
  });

  it('should not render the asset dropdown if token length is 0', () => {
    wrapper.setProps({ tokens: [] });
    const PageContainerContentChild = wrapper
      .find(PageContainerContent)
      .children();
    expect(PageContainerContentChild.childAt(1).is(SendAssetRow)).toStrictEqual(
      true,
    );
    expect(
      PageContainerContentChild.childAt(2).find(
        'send-v2__asset-dropdown__single-asset',
      ),
    ).toHaveLength(0);
  });

  it('should render warning', () => {
    wrapper.setProps({
      warning: 'watchout',
    });

    const dialog = wrapper.find(Dialog).at(0);

    expect(dialog.props().type).toStrictEqual('warning');
    expect(dialog.props().children).toStrictEqual('watchout_t');
    expect(dialog).toHaveLength(1);
  });
});
