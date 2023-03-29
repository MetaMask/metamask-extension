import { renderHook } from '@testing-library/react-hooks';
import { DESKTOP_HOOK_TYPES } from '@metamask/desktop/dist/constants';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../shared/constants/desktop';
import { DESKTOP_ERROR_ROUTE } from '../helpers/constants/routes';
import { registerOnDesktopDisconnect } from './desktopHooks';

describe('desktopHooks', () => {
  describe('registerOnDesktopDisconnect', () => {
    it('push desktop connection lost route when request type is disconnect', () => {
      const mockHistoryPush = jest.fn();

      const { result } = renderHook(() =>
        registerOnDesktopDisconnect({ push: mockHistoryPush }),
      );

      expect(result).toBeInstanceOf(Object);
      expect(mockHistoryPush).not.toHaveBeenCalled();

      result.current({ type: DESKTOP_HOOK_TYPES.DISCONNECT });

      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST}`,
      );
    });
  });
});
