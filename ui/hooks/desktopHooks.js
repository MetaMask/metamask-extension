import { DESKTOP_HOOK_TYPES } from '@metamask/desktop/dist/constants';
import { DESKTOP_ERROR_ROUTE } from '../helpers/constants/routes';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../shared/constants/desktop';

const registerOnDesktopDisconnect = (history) => {
  return (request) => {
    if (request.type === DESKTOP_HOOK_TYPES.DISCONNECT) {
      const connectionLostRoute = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST}`;
      history.push(connectionLostRoute);
    }
  };
};

export { registerOnDesktopDisconnect };
