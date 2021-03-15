import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Dialog from '../../../../components/ui/dialog';
import AddRecipient from './add-recipient.component';

const propsMethodSpies = {
  closeToDropdown: sinon.spy(),
  openToDropdown: sinon.spy(),
  updateGas: sinon.spy(),
  updateSendTo: sinon.spy(),
  updateSendToError: sinon.spy(),
  updateSendToWarning: sinon.spy(),
};

describe('AddRecipient Component', function () {
  let wrapper;
  let instance;

  beforeEach(function () {
    wrapper = shallow(
      <AddRecipient
        closeToDropdown={propsMethodSpies.closeToDropdown}
        inError={false}
        inWarning={false}
        network="mockNetwork"
        openToDropdown={propsMethodSpies.openToDropdown}
        to="mockTo"
        toAccounts={['mockAccount']}
        toDropdownOpen={false}
        updateGas={propsMethodSpies.updateGas}
        updateSendTo={propsMethodSpies.updateSendTo}
        updateSendToError={propsMethodSpies.updateSendToError}
        updateSendToWarning={propsMethodSpies.updateSendToWarning}
        addressBook={[
          {
            address: '0x80F061544cC398520615B5d3e7A3BedD70cd4510',
            name: 'Fav 5',
          },
        ]}
        nonContacts={[
          {
            address: '0x70F061544cC398520615B5d3e7A3BedD70cd4510',
            name: 'Fav 7',
          },
        ]}
        contacts={[
          {
            address: '0x60F061544cC398520615B5d3e7A3BedD70cd4510',
            name: 'Fav 6',
          },
        ]}
      />,
      { context: { t: (str) => `${str}_t` } },
    );
    instance = wrapper.instance();
  });

  afterEach(function () {
    propsMethodSpies.closeToDropdown.resetHistory();
    propsMethodSpies.openToDropdown.resetHistory();
    propsMethodSpies.updateSendTo.resetHistory();
    propsMethodSpies.updateSendToError.resetHistory();
    propsMethodSpies.updateSendToWarning.resetHistory();
    propsMethodSpies.updateGas.resetHistory();
  });

  describe('selectRecipient', function () {
    it('should call updateSendTo', function () {
      assert.strictEqual(propsMethodSpies.updateSendTo.callCount, 0);
      instance.selectRecipient('mockTo2', 'mockNickname');
      assert.strictEqual(propsMethodSpies.updateSendTo.callCount, 1);
      assert.deepStrictEqual(propsMethodSpies.updateSendTo.getCall(0).args, [
        'mockTo2',
        'mockNickname',
      ]);
    });

    it('should call updateGas if there is no to error', function () {
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0);
      instance.selectRecipient(false);
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 1);
    });
  });

  describe('render', function () {
    it('should render a component', function () {
      assert.strictEqual(
        wrapper.find('.send__select-recipient-wrapper').length,
        1,
      );
    });

    it('should render no content if there are no recents, transfers, and contacts', function () {
      wrapper.setProps({
        ownedAccounts: [],
        addressBook: [],
      });

      assert.strictEqual(
        wrapper.find('.send__select-recipient-wrapper__list__link').length,
        0,
      );
      assert.strictEqual(
        wrapper.find('.send__select-recipient-wrapper__group').length,
        0,
      );
    });

    it('should render transfer', function () {
      wrapper.setProps({
        ownedAccounts: [
          { address: '0x123', name: '123' },
          { address: '0x124', name: '124' },
        ],
        addressBook: [{ address: '0x456', name: 'test-name' }],
      });
      wrapper.setState({ isShowingTransfer: true });

      const xferLink = wrapper.find(
        '.send__select-recipient-wrapper__list__link',
      );
      assert.strictEqual(xferLink.length, 1);

      const groups = wrapper.find('RecipientGroup');
      assert.strictEqual(
        groups.shallow().find('.send__select-recipient-wrapper__group').length,
        1,
      );
    });

    it('should render ContactList', function () {
      wrapper.setProps({
        ownedAccounts: [
          { address: '0x123', name: '123' },
          { address: '0x124', name: '124' },
        ],
        addressBook: [{ address: '0x125' }],
      });

      const contactList = wrapper.find('ContactList');

      assert.strictEqual(contactList.length, 1);
    });

    it('should render contacts', function () {
      wrapper.setProps({
        addressBook: [
          { address: '0x125', name: 'alice' },
          { address: '0x126', name: 'alex' },
          { address: '0x127', name: 'catherine' },
        ],
      });
      wrapper.setState({ isShowingTransfer: false });

      const xferLink = wrapper.find(
        '.send__select-recipient-wrapper__list__link',
      );
      assert.strictEqual(xferLink.length, 0);

      const groups = wrapper.find('ContactList');
      assert.strictEqual(groups.length, 1);

      assert.strictEqual(
        groups.find('.send__select-recipient-wrapper__group-item').length,
        0,
      );
    });

    it('should render error when query has no results', function () {
      wrapper.setProps({
        addressBook: [],
        toError: 'bad',
        contacts: [],
        nonContacts: [],
      });

      const dialog = wrapper.find(Dialog);

      assert.strictEqual(dialog.props().type, 'error');
      assert.strictEqual(dialog.props().children, 'bad_t');
      assert.strictEqual(dialog.length, 1);
    });

    it('should render error when query has ens does not resolve', function () {
      wrapper.setProps({
        addressBook: [],
        toError: 'bad',
        ensResolutionError: 'very bad',
        contacts: [],
        nonContacts: [],
      });

      const dialog = wrapper.find(Dialog);

      assert.strictEqual(dialog.props().type, 'error');
      assert.strictEqual(dialog.props().children, 'very bad');
      assert.strictEqual(dialog.length, 1);
    });

    it('should not render error when ens resolved', function () {
      wrapper.setProps({
        addressBook: [],
        toError: 'bad',
        ensResolution: '0x128',
      });

      const dialog = wrapper.find(Dialog);

      assert.strictEqual(dialog.length, 0);
    });
  });
});
