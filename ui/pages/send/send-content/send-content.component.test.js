import React from 'react';
import { shallow } from 'enzyme';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import Dialog from '../../../components/ui/dialog';
import SendContent from './send-content.component';

import SendAmountRow from './send-amount-row/send-amount-row.container';
import SendGasRow from './send-gas-row/send-gas-row.container';
import SendHexDataRow from './send-hex-data-row/send-hex-data-row.container';
import SendAssetRow from './send-asset-row/send-asset-row.container';

describe('SendContent Component', () => {
  let wrapper;

  const defaultProps = {
    showHexData: true,
    gasIsExcessive: false,
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
      expect(PageContainerContentChild.childAt(3).is(SendGasRow)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(4).is(SendHexDataRow),
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
      expect(PageContainerContentChild.childAt(3).is(SendGasRow)).toStrictEqual(
        true,
      );
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
      expect(PageContainerContentChild.childAt(2).is(SendGasRow)).toStrictEqual(
        true,
      );
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
      expect(PageContainerContentChild.childAt(2).is(SendGasRow)).toStrictEqual(
        true,
      );
      expect(wrapper.find(Dialog)).toHaveLength(0);
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
      PageContainerContentChild.childAt(1).find(
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
