let mapStateToProps;
let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (ms, md) => {
    mapStateToProps = ms;
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  getAddressBook: (s) => [{ name: `mockAddressBook:${s}` }],
  getAddressBookEntry: (s) => `mockAddressBookEntry:${s}`,
  getInternalAccountsSortedByKeyring: () => [
    { address: 'address-1', metadata: { name: `account1:mockState` } },
    { address: 'address-2', metadata: { name: `account2:mockState` } },
  ],
  getCurrentNetworkTransactions: (s) => `getCurrentNetworkTransactions:${s}`,
}));

jest.mock('../../../../../ducks/domains', () => ({
  getDomainResolution: (s) => `mockSendDomainResolution:${s}`,
  getDomainType: (s) => `mockSendDomainType:${s}`,
  getResolvingSnap: (s) => `mockSendResolvingSnap:${s}`,
  getDomainError: (s) => `mockSendDomainResolutionError:${s}`,
  getDomainWarning: (s) => `mockSendDomainResolutionWarning:${s}`,
  useMyAccountsForRecipientSearch: (s) =>
    `useMyAccountsForRecipientSearch:${s}`,
}));

jest.mock('../../../../../ducks/send', () => ({
  updateRecipient: ({ address, nickname }) =>
    `{mockUpdateRecipient: {address: ${address}, nickname: ${nickname}}}`,
  updateRecipientUserInput: (s) => `mockUpdateRecipientUserInput:${s}`,
  useMyAccountsForRecipientSearch: (s) =>
    `mockUseMyAccountsForRecipientSearch:${s}`,
  useContactListForRecipientSearch: (s) =>
    `mockUseContactListForRecipientSearch:${s}`,
  getRecipientUserInput: (s) => `mockRecipientUserInput:${s}`,
  getRecipient: (s) => `mockRecipient:${s}`,
}));
require('./add-recipient.container');

describe('add-recipient container', () => {
  describe('mapStateToProps()', () => {
    it('should map the correct properties to props', () => {
      expect(mapStateToProps('mockState')).toStrictEqual({
        addressBook: [{ name: 'mockAddressBook:mockState' }],
        addressBookEntryName: undefined,
        contacts: [{ name: 'mockAddressBook:mockState' }],
        domainResolution: 'mockSendDomainResolution:mockState',
        domainError: 'mockSendDomainResolutionError:mockState',
        domainWarning: 'mockSendDomainResolutionWarning:mockState',
        nonContacts: [],
        ownedAccounts: [
          { address: 'address-1', name: 'account1:mockState' },
          { address: 'address-2', name: 'account2:mockState' },
        ],
        userInput: 'mockRecipientUserInput:mockState',
        recipient: 'mockRecipient:mockState',
        resolvingSnap: 'mockSendResolvingSnap:mockState',
        domainType: 'mockSendDomainType:mockState',
      });
    });
  });

  describe('mapDispatchToProps()', () => {
    describe('updateRecipient()', () => {
      const dispatchSpy = jest.fn();

      const mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);

      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateRecipient({
          address: 'mockAddress',
          nickname: 'mockNickname',
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy.mock.calls[0][0]).toStrictEqual(
          '{mockUpdateRecipient: {address: mockAddress, nickname: mockNickname}}',
        );
      });
    });
  });
});
