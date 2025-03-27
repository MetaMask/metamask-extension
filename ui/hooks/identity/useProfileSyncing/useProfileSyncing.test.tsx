import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import * as actions from '../../../store/actions';
import {
  useDisableProfileSyncing,
  useEnableProfileSyncing,
} from './useProfileSyncing';

describe('useEnableProfileSyncing()', () => {
  it('should enable profile syncing', async () => {
    const mockEnableProfileSyncingAction = jest.spyOn(
      actions,
      'enableProfileSyncing',
    );

    const { result } = renderHookWithProviderTyped(
      () => useEnableProfileSyncing(),
      {},
    );
    await act(async () => {
      await result.current.enableProfileSyncing();
    });

    expect(mockEnableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useDisableProfileSyncing()', () => {
  it('should disable profile syncing', async () => {
    const mockDisableProfileSyncingAction = jest.spyOn(
      actions,
      'disableProfileSyncing',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDisableProfileSyncing(),
      {},
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockDisableProfileSyncingAction).toHaveBeenCalled();
  });
});
