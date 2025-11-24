import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import { SURVEY_DATE, SURVEY_GMT } from '../../../helpers/constants/survey';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  selectNewSrpAdded,
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
  selectShowCopyAddressToast,
  selectShowConnectAccountGroupToast,
} from './selectors';

const createMockSurveyState = (surveyLinkLastClickedOrClosed?: number) => ({
  metamask: {
    ...mockState.metamask,
    surveyLinkLastClickedOrClosed,
  },
});

const createMockPrivacyPolicyState = (
  newPrivacyPolicyToastClickedOrClosed?: boolean,
  onboardingDate?: number,
  newPrivacyPolicyToastShownDate?: number | null,
) => ({
  metamask: {
    ...mockState.metamask,
    newPrivacyPolicyToastClickedOrClosed,
    onboardingDate,
    newPrivacyPolicyToastShownDate,
  },
});

const createMockAppState = (
  showNewSrpAddedToast?: boolean,
  showCopyAddressToast?: boolean,
) => ({
  appState: {
    ...mockState.appState,
    showNewSrpAddedToast,
    showCopyAddressToast,
  },
});

const createMockConnectAccountGroupState = (
  origin: string | null,
  unconnectedAccount: boolean,
  permissionHistory: object = {},
  subjects: object = {},
) => {
  const store = configureStore({
    ...mockState,
    activeTab: {
      ...mockState.activeTab,
      origin,
    },
    metamask: {
      ...mockState.metamask,
      alertEnabledness: {
        ...mockState.metamask.alertEnabledness,
        unconnectedAccount,
      },
      permissionHistory,
      subjects,
    },
  });

  return store.getState();
};

describe('#getShowSurveyToast', () => {
  const realDateNow = Date.now;

  afterEach(() => {
    Date.now = realDateNow;
  });

  it('shows the survey link when not yet seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(true);
  });

  it('does not show the survey link when seen and within time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(123456789);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link before time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 11:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });

  it('does not show the survey link after time bounds', () => {
    Date.now = () =>
      new Date(`${SURVEY_DATE} 14:25:00 ${SURVEY_GMT}`).getTime();
    const mockStateData = createMockSurveyState(undefined);
    const result = selectShowSurveyToast(mockStateData);
    expect(result).toStrictEqual(false);
  });
});

describe('#getShowPrivacyPolicyToast', () => {
  let dateNowSpy: jest.SpyInstance;

  describe('mock one day after', () => {
    beforeEach(() => {
      const dayAfterPolicyDate = new Date(PRIVACY_POLICY_DATE);
      dayAfterPolicyDate.setDate(dayAfterPolicyDate.getDate() + 1);

      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(dayAfterPolicyDate.getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
      const mockStateData = createMockPrivacyPolicyState(
        false,
        new Date(PRIVACY_POLICY_DATE).setDate(
          new Date(PRIVACY_POLICY_DATE).getDate() - 2,
        ),
      );
      const result = selectShowPrivacyPolicyToast(mockStateData);
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          true,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });
  });

  describe('mock same day', () => {
    beforeEach(() => {
      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date(PRIVACY_POLICY_DATE).getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          false,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });

    it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          true,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(true);
    });
  });

  describe('mock day before', () => {
    beforeEach(() => {
      const dayBeforePolicyDate = new Date(PRIVACY_POLICY_DATE);
      dayBeforePolicyDate.setDate(dayBeforePolicyDate.getDate() - 1);

      dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(dayBeforePolicyDate.getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('does not show the privacy policy toast before the policy date', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(
          false,
          new Date(PRIVACY_POLICY_DATE).setDate(
            new Date(PRIVACY_POLICY_DATE).getDate() - 2,
          ),
        ),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });

    it('does not show the privacy policy toast before the policy date even if onboardingDate is not set', () => {
      const result = selectShowPrivacyPolicyToast({
        ...createMockPrivacyPolicyState(false, undefined),
      });
      expect(result.showPrivacyPolicyToast).toBe(false);
    });
  });
});

describe('#getShowNewSrpAddedToast', () => {
  it('returns true if the user has not seen the toast', () => {
    const mockStateData = createMockAppState(true);
    const result = selectNewSrpAdded(mockStateData);
    expect(result).toBe(true);
  });
});

describe('#selectShowCopyAddressToast', () => {
  it('returns true when showCopyAddressToast is true', () => {
    const mockStateData = createMockAppState(undefined, true);
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(true);
  });

  it('returns false when showCopyAddressToast is false', () => {
    const mockStateData = createMockAppState(undefined, false);
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(false);
  });

  it('returns false when showCopyAddressToast is undefined', () => {
    const mockStateData = createMockAppState();
    const result = selectShowCopyAddressToast(mockStateData);
    expect(result).toBe(false);
  });
});

describe('#selectShowConnectAccountGroupToast', () => {
  const mockAccountGroup = {
    id: 'account-group-1',
    type: 'hd',
    metadata: {
      name: 'Test Account Group',
    },
    walletName: 'Test Wallet',
    walletId: 'test-wallet-1',
    accounts: [
      {
        id: 'account-1',
        address: '0x123',
        type: 'eip155:eoa',
        scopes: ['eip155:1', 'eip155:137'],
        options: {},
        methods: [],
        metadata: {
          name: 'Account 1',
          keyring: { type: 'HD Key Tree' },
          importTime: Date.now(),
        },
      },
      {
        id: 'account-2',
        address: '0x456',
        type: 'eip155:eoa',
        scopes: ['eip155:1', 'eip155:137'],
        options: {},
        methods: [],
        metadata: {
          name: 'Account 2',
          keyring: { type: 'HD Key Tree' },
          importTime: Date.now(),
        },
      },
    ],
  } as unknown as AccountGroupWithInternalAccounts;

  it('returns false when account group is not supported by existing chain IDs', () => {
    const mockStateData = createMockConnectAccountGroupState(
      'https://example.com',
      true,
      {
        'https://example.com': {
          ethAccounts: {
            accounts: {
              '0x789': 1234567890,
            },
          },
        },
      },
      {
        'https://example.com': {
          permissions: {
            ethAccounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x789'],
                },
              ],
            },
            'endowment:caip25': {
              caveats: [
                {
                  type: 'caip25',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        methods: ['eth_sendTransaction'],
                        notifications: [],
                        accounts: ['eip155:1:0x789'],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    );

    const result = selectShowConnectAccountGroupToast(
      mockStateData,
      mockAccountGroup,
    );
    expect(result).toBe(false);
  });

  it('returns false when unconnectedAccount alert is disabled', () => {
    const mockStateData = createMockConnectAccountGroupState(
      'https://example.com',
      false,
      {
        'https://example.com': {
          ethAccounts: {
            accounts: {
              '0x789': 1234567890,
            },
          },
        },
      },
    );

    const result = selectShowConnectAccountGroupToast(
      mockStateData,
      mockAccountGroup,
    );
    expect(result).toBe(false);
  });

  it('throws error when no active tab origin', () => {
    const mockStateData = createMockConnectAccountGroupState(null, true);

    // When origin is null, the selector throws an error trying to get permissions
    expect(() => {
      selectShowConnectAccountGroupToast(mockStateData, mockAccountGroup);
    }).toThrow();
  });

  it('returns false when no connected accounts exist', () => {
    const mockStateData = createMockConnectAccountGroupState(
      'https://example.com',
      true,
    );

    const result = selectShowConnectAccountGroupToast(
      mockStateData,
      mockAccountGroup,
    );
    expect(result).toBe(false);
  });

  it('returns false when account group is already connected', () => {
    const mockStateData = createMockConnectAccountGroupState(
      'https://example.com',
      true,
      {
        'https://example.com': {
          ethAccounts: {
            accounts: {
              '0x123': 1234567890,
            },
          },
        },
      },
      {
        'https://example.com': {
          permissions: {
            ethAccounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x123'],
                },
              ],
            },
          },
        },
      },
    );

    const result = selectShowConnectAccountGroupToast(
      mockStateData,
      mockAccountGroup,
    );
    expect(result).toBe(false);
  });
});
