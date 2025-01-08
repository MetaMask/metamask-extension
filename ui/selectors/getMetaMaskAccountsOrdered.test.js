import mockState from '../../test/data/mock-state.json';
import * as getMetaMaskAccounts from './getMetaMaskAccounts';

describe('#getMetaMaskAccounts', () => {
  it('#getTargetSubjectMetadata', () => {
    const targetSubjectsMetadata = getMetaMaskAccounts.getTargetSubjectMetadata(
      mockState,
      'npm:@metamask/test-snap-bip44',
    );
    expect(targetSubjectsMetadata).toStrictEqual({
      iconUrl: null,
      name: '@metamask/test-snap-bip44',
      subjectType: 'snap',
      version: '1.2.3',
    });
  });

  describe('#getInternalAccount', () => {
    it("returns undefined if the account doesn't exist", () => {
      expect(
        getMetaMaskAccounts.getInternalAccount(mockState, 'unknown'),
      ).toBeUndefined();
    });

    it('returns the account', () => {
      expect(
        getMetaMaskAccounts.getInternalAccount(
          mockState,
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        ),
      ).toStrictEqual(
        mockState.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ],
      );
    });
  });
});
