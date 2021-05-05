import sinon from 'sinon';

import { updateSendTo } from '../../../../store/actions';

let mapStateToProps;
let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (ms, md) => {
    mapStateToProps = ms;
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../../app/selectors', () => ({
  getSendEnsResolution: (s) => `mockSendEnsResolution:${s}`,
  getSendEnsResolutionError: (s) => `mockSendEnsResolutionError:${s}`,
  getAddressBook: (s) => [{ name: `mockAddressBook:${s}` }],
  getAddressBookEntry: (s) => `mockAddressBookEntry:${s}`,
  accountsWithSendEtherInfoSelector: () => [
    { name: `account1:mockState` },
    { name: `account2:mockState` },
  ],
}));

jest.mock('../../../../../app/store/actions', () => ({
  updateSendTo: jest.fn(),
}));

require('./add-recipient.container.js');

describe('add-recipient container', () => {
  describe('mapStateToProps()', () => {
    it('should map the correct properties to props', () => {
      expect(mapStateToProps('mockState')).toStrictEqual({
        addressBook: [{ name: 'mockAddressBook:mockState' }],
        contacts: [{ name: 'mockAddressBook:mockState' }],
        ensResolution: 'mockSendEnsResolution:mockState',
        ensResolutionError: 'mockSendEnsResolutionError:mockState',
        ownedAccounts: [
          { name: `account1:mockState` },
          { name: `account2:mockState` },
        ],
        addressBookEntryName: undefined,
        nonContacts: [],
      });
    });
  });

  describe('mapDispatchToProps()', () => {
    describe('updateSendTo()', () => {
      const dispatchSpy = sinon.spy();
      const mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);

      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendTo('mockTo', 'mockNickname');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(updateSendTo).toHaveBeenCalled();
        expect(updateSendTo).toHaveBeenCalledWith('mockTo', 'mockNickname');
      });
    });
  });
});
