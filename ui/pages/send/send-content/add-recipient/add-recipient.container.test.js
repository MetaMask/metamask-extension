let mapStateToProps;
let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (ms, md) => {
    mapStateToProps = ms;
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../selectors', () => ({
  getAddressBook: (s) => [{ name: `mockAddressBook:${s}` }],
  getAddressBookEntry: (s) => `mockAddressBookEntry:${s}`,
  accountsWithSendEtherInfoSelector: () => [
    { name: `account1:mockState` },
    { name: `account2:mockState` },
  ],
}));

jest.mock('../../../../ducks/ens', () => ({
  getEnsResolution: (s) => `mockSendEnsResolution:${s}`,
  getEnsError: (s) => `mockSendEnsResolutionError:${s}`,
  getEnsWarning: (s) => `mockSendEnsResolutionWarning:${s}`,
  useMyAccountsForRecipientSearch: (s) =>
    `useMyAccountsForRecipientSearch:${s}`,
}));

jest.mock('../../../../ducks/send', () => ({
  updateRecipient: ({ address, nickname }) =>
    `{mockUpdateRecipient: {address: ${address}, nickname: ${nickname}}}`,
  updateRecipientUserInput: (s) => `mockUpdateRecipientUserInput:${s}`,
  useMyAccountsForRecipientSearch: (s) =>
    `mockUseMyAccountsForRecipientSearch:${s}`,
  useContactListForRecipientSearch: (s) =>
    `mockUseContactListForRecipientSearch:${s}`,
  getIsUsingMyAccountForRecipientSearch: (s) =>
    `mockGetIsUsingMyAccountForRecipientSearch:${s}`,
  getRecipientUserInput: (s) => `mockRecipientUserInput:${s}`,
  getRecipient: (s) => `mockRecipient:${s}`,
}));

require('./add-recipient.container.js');

describe('add-recipient container', () => {
  describe('mapStateToProps()', () => {
    it('should map the correct properties to props', () => {
      expect(mapStateToProps('mockState')).toStrictEqual({
        addressBook: [{ name: 'mockAddressBook:mockState' }],
        addressBookEntryName: undefined,
        contacts: [{ name: 'mockAddressBook:mockState' }],
        ensResolution: 'mockSendEnsResolution:mockState',
        ensError: 'mockSendEnsResolutionError:mockState',
        ensWarning: 'mockSendEnsResolutionWarning:mockState',
        nonContacts: [],
        ownedAccounts: [
          { name: 'account1:mockState' },
          { name: 'account2:mockState' },
        ],
        isUsingMyAccountsForRecipientSearch:
          'mockGetIsUsingMyAccountForRecipientSearch:mockState',
        userInput: 'mockRecipientUserInput:mockState',
        recipient: 'mockRecipient:mockState',
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
