import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Dialog from '../../../../components/ui/dialog';
import AddRecipient from './add-recipient.component';

const propsMethodSpies = {
  updateRecipient: sinon.spy(),
  useMyAccountsForRecipientSearch: sinon.spy(),
  useContactListForRecipientSearch: sinon.spy(),
};

describe('AddRecipient Component', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <AddRecipient
        userInput=""
        recipient={{
          address: '',
          nickname: '',
          error: '',
          warning: '',
        }}
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
  });

  afterEach(() => {
    propsMethodSpies.updateRecipient.resetHistory();
    propsMethodSpies.useMyAccountsForRecipientSearch.resetHistory();
    propsMethodSpies.useContactListForRecipientSearch.resetHistory();
  });

  describe('render', () => {
    it('should render a component', () => {
      expect(wrapper.find('.send__select-recipient-wrapper')).toHaveLength(1);
    });

    it('should render no content if there are no recents, transfers, and contacts', () => {
      wrapper.setProps({
        ownedAccounts: [],
        addressBook: [],
      });

      expect(
        wrapper.find('.send__select-recipient-wrapper__list__link'),
      ).toHaveLength(0);
      expect(
        wrapper.find('.send__select-recipient-wrapper__group'),
      ).toHaveLength(0);
    });

    it('should render transfer', () => {
      wrapper.setProps({
        isUsingMyAccountsForRecipientSearch: true,
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
      expect(xferLink).toHaveLength(1);

      const groups = wrapper.find('RecipientGroup');
      expect(
        groups.shallow().find('.send__select-recipient-wrapper__group'),
      ).toHaveLength(1);
    });

    it('should render ContactList', () => {
      wrapper.setProps({
        ownedAccounts: [
          { address: '0x123', name: '123' },
          { address: '0x124', name: '124' },
        ],
        addressBook: [{ address: '0x125' }],
      });

      const contactList = wrapper.find('ContactList');

      expect(contactList).toHaveLength(1);
    });

    it('should render contacts', () => {
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
      expect(xferLink).toHaveLength(0);

      const groups = wrapper.find('ContactList');
      expect(groups).toHaveLength(1);

      expect(
        groups.find('.send__select-recipient-wrapper__group-item'),
      ).toHaveLength(0);
    });

    it('should render error when query has no results', () => {
      wrapper.setProps({
        addressBook: [],
        ensError: 'bad',
        contacts: [],
        nonContacts: [],
      });

      const dialog = wrapper.find(Dialog);

      expect(dialog.props().type).toStrictEqual('error');
      expect(dialog.props().children).toStrictEqual('bad_t');
      expect(dialog).toHaveLength(1);
    });

    it('should render error when query has ens does not resolve', () => {
      wrapper.setProps({
        addressBook: [],
        ensError: 'very bad',
        contacts: [],
        nonContacts: [],
      });

      const dialog = wrapper.find(Dialog);

      expect(dialog.props().type).toStrictEqual('error');
      expect(dialog.props().children).toStrictEqual('very bad_t');
      expect(dialog).toHaveLength(1);
    });

    it('should render error when ens resolved but ens error exists', () => {
      wrapper.setProps({
        addressBook: [],
        ensError: 'bad',
        ensResolution: '0x128',
      });

      const dialog = wrapper.find(Dialog);

      expect(dialog).toHaveLength(1);
    });
  });
});
