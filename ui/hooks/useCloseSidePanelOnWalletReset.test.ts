import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../shared/constants/app';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useCloseSidePanelOnWalletReset } from './useCloseSidePanelOnWalletReset';

jest.mock('../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

describe('useCloseSidePanelOnWalletReset', () => {
  let closeSpy: jest.SpyInstance;

  beforeEach(() => {
    closeSpy = jest.spyOn(window, 'close').mockImplementation(() => undefined);
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
  });

  afterEach(() => {
    closeSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('closes the side panel when wallet reset is in progress', () => {
    renderHookWithProvider(() => useCloseSidePanelOnWalletReset(), {
      metamask: { isWalletResetInProgress: true },
    });

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not close when wallet reset is not in progress', () => {
    renderHookWithProvider(() => useCloseSidePanelOnWalletReset(), {
      metamask: { isWalletResetInProgress: false },
    });

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('does not close outside the side panel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

    renderHookWithProvider(() => useCloseSidePanelOnWalletReset(), {
      metamask: { isWalletResetInProgress: true },
    });

    expect(closeSpy).not.toHaveBeenCalled();
  });
});
