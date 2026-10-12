import { KeyringTypes } from '@metamask/keyring-controller';
import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { UPDATE_METAMASK_STATE } from '../../store/actionConstants';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';
import { useBrazeIdentity } from './use-braze-identity';

jest.mock('./identify-braze-user', () => ({
  identifyBrazeUser: jest.fn(),
  clearBrazeUser: jest.fn(),
}));

const mockIdentifyBrazeUser = jest.mocked(identifyBrazeUser);
const mockClearBrazeUser = jest.mocked(clearBrazeUser);

const hdKeyring = (id: string) => ({
  type: KeyringTypes.hd,
  accounts: [],
  metadata: { id, name: '' },
});

type ArrangeState = {
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  isSignedIn?: boolean;
  canonicalProfileId?: string;
  keyringId?: string;
};

const arrangeState = (overrides: ArrangeState = {}) => {
  const {
    isUnlocked = true,
    useExternalServices = true,
    isSignedIn = true,
    keyringId = 'entropy-1',
  } = overrides;
  const canonicalProfileId =
    'canonicalProfileId' in overrides
      ? overrides.canonicalProfileId
      : 'canonical-123';

  return {
    metamask: {
      isUnlocked,
      useExternalServices,
      isSignedIn,
      keyrings: canonicalProfileId ? [hdKeyring(keyringId)] : [],
      srpSessionData: canonicalProfileId
        ? {
            [keyringId]: {
              profile: { canonicalProfileId },
            },
          }
        : undefined,
    },
  };
};

describe('useBrazeIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentifyBrazeUser.mockResolvedValue(true);
    mockClearBrazeUser.mockResolvedValue(undefined);
  });

  it('identifies when unlocked, signed in, and a canonical profile ID is present', async () => {
    renderHookWithProviderTyped(() => useBrazeIdentity(), arrangeState());

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });
    expect(mockIdentifyBrazeUser).toHaveBeenCalledWith('canonical-123');
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not identify when the canonical profile ID is missing', () => {
    renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState({ canonicalProfileId: undefined }),
    );

    expect(mockIdentifyBrazeUser).not.toHaveBeenCalled();
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not identify when the wallet is locked', () => {
    renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState({ isUnlocked: false }),
    );

    expect(mockIdentifyBrazeUser).not.toHaveBeenCalled();
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not identify when basic functionality is off', () => {
    renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState({ useExternalServices: false }),
    );

    expect(mockIdentifyBrazeUser).not.toHaveBeenCalled();
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not identify or wipe on the initial signed-out mount', () => {
    renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState({ isSignedIn: false, canonicalProfileId: undefined }),
    );

    expect(mockIdentifyBrazeUser).not.toHaveBeenCalled();
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not call identify twice for the same ID', async () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isUnlocked: true },
      });
    });

    expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
  });

  it('re-identifies when the canonical profile ID changes', async () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: {
          keyrings: [hdKeyring('entropy-1')],
          srpSessionData: {
            'entropy-1': {
              profile: { canonicalProfileId: 'canonical-456' },
            },
          },
        },
      });
    });

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(2);
    });
    expect(mockIdentifyBrazeUser).toHaveBeenLastCalledWith('canonical-456');
    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not wipe when the wallet locks after identifying', async () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isUnlocked: false },
      });
    });

    expect(mockClearBrazeUser).not.toHaveBeenCalled();
  });

  it('wipes after transitioning from signed in to signed out', async () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: {
          isSignedIn: false,
          srpSessionData: undefined,
          keyrings: [hdKeyring('entropy-1')],
        },
      });
    });

    await waitFor(() => {
      expect(mockClearBrazeUser).toHaveBeenCalledTimes(1);
    });
  });

  it('wipes when basic functionality is turned off after identifying', async () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    await waitFor(() => {
      expect(mockIdentifyBrazeUser).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { useExternalServices: false },
      });
    });

    await waitFor(() => {
      expect(mockClearBrazeUser).toHaveBeenCalledTimes(1);
    });
  });
});
