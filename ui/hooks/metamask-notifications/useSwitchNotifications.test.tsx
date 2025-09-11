import { waitFor } from '@testing-library/react';
import * as ActionsModule from '../../store/actions';
import * as NotificationSelectorsModule from '../../selectors/metamask-notifications/metamask-notifications';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers';
import {
  useSwitchFeatureAnnouncementsChange,
  useSwitchAccountNotificationsChange,
  useAccountSettingsProps,
} from './useSwitchNotifications';

describe('useSwitchFeatureAnnouncementsChange() tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const arrangeMocks = () => {
    const mockSetFeatureAnnouncementsEnabled = jest.spyOn(
      ActionsModule,
      'setFeatureAnnouncementsEnabled',
    );
    return {
      mockSetFeatureAnnouncementsEnabled,
    };
  };

  it('should update feature announcement when callback invoked', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSwitchFeatureAnnouncementsChange(),
      {},
    );

    await hook.result.current.onChange(true);
    expect(mocks.mockSetFeatureAnnouncementsEnabled).toHaveBeenCalled();
  });

  it('should update error state when callback fails', async () => {
    const mocks = arrangeMocks();
    mocks.mockSetFeatureAnnouncementsEnabled.mockImplementation(() => {
      throw new Error('Mock Fail');
    });
    const hook = renderHookWithProviderTyped(
      () => useSwitchFeatureAnnouncementsChange(),
      {},
    );

    await hook.result.current.onChange(true);
    expect(hook.result.current.error).toBeDefined();
  });
});

describe('useSwitchAccountNotificationsChange() tests', () => {
  const arrangeMocks = () => {
    const mockEnableAccounts = jest.spyOn(ActionsModule, 'enableAccounts');
    const mockDisableAccounts = jest.spyOn(ActionsModule, 'disableAccounts');

    return {
      mockEnableAccounts,
      mockDisableAccounts,
    };
  };

  it('should invoke update notification triggers when an address is enabled', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSwitchAccountNotificationsChange(),
      {},
    );

    await hook.result.current.onChange(['0x1'], true);
    expect(mocks.mockEnableAccounts).toHaveBeenCalledWith(['0x1']);
    expect(mocks.mockDisableAccounts).not.toHaveBeenCalled();
  });

  it('should invoke delete notification triggers when an address is disabled', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSwitchAccountNotificationsChange(),
      {},
    );

    await hook.result.current.onChange(['0x1'], false);
    expect(mocks.mockEnableAccounts).not.toHaveBeenCalled();
    expect(mocks.mockDisableAccounts).toHaveBeenCalledWith(['0x1']);
  });

  it('should return an error value if it fails to update or delete triggers', async () => {
    const mocks = arrangeMocks();
    mocks.mockEnableAccounts.mockImplementation(() => {
      throw new Error('Mock Error');
    });
    mocks.mockDisableAccounts.mockImplementation(() => {
      throw new Error('Mock Error');
    });

    const act = async (testEnableOrDisable: boolean) => {
      const hook = renderHookWithProviderTyped(
        () => useSwitchAccountNotificationsChange(),
        {},
      );
      await hook.result.current.onChange(['0x1'], testEnableOrDisable);
      return hook.result.current.error;
    };

    const enableError = await act(true);
    expect(enableError).toBeDefined();

    const disableError = await act(false);
    expect(disableError).toBeDefined();
  });
});

describe('useAccountSettingsProps() tests', () => {
  const arrangeMocks = () => {
    const mockCheckAccountsPresence = jest.spyOn(
      ActionsModule,
      'checkAccountsPresence',
    );
    const mockGetIsUpdatingMetamaskNotificationsAccount = jest
      .spyOn(
        NotificationSelectorsModule,
        'getIsUpdatingMetamaskNotificationsAccount',
      )
      .mockReturnValue([]);
    const mockSelectIsMetamaskNotificationsEnabled = jest
      .spyOn(
        NotificationSelectorsModule,
        'selectIsMetamaskNotificationsEnabled',
      )
      .mockReturnValue(true);

    return {
      mockCheckAccountsPresence,
      mockGetIsUpdatingMetamaskNotificationsAccount,
      mockSelectIsMetamaskNotificationsEnabled,
    };
  };

  it('Should invoke effect when notifications are enabled', async () => {
    const mocks = arrangeMocks();
    renderHookWithProviderTyped(() => useAccountSettingsProps(['0x1']), {});

    await waitFor(() => {
      expect(mocks.mockCheckAccountsPresence).toHaveBeenCalled();
    });
  });

  it('Should not invoke effect when notifications are disabled', async () => {
    const mocks = arrangeMocks();
    mocks.mockSelectIsMetamaskNotificationsEnabled.mockReturnValue(false);
    renderHookWithProviderTyped(() => useAccountSettingsProps(['0x1']), {});

    await waitFor(() => {
      expect(mocks.mockCheckAccountsPresence).not.toHaveBeenCalled();
    });
  });

  it('Should be able to invoke refetch accounts function', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAccountSettingsProps(['0x1']),
      {},
    );

    await hook.result.current.update(['0x1', '0x2']);
    await waitFor(() => {
      expect(mocks.mockCheckAccountsPresence).toHaveBeenCalledWith([
        '0x1',
        '0x2',
      ]);
    });
  });
});
