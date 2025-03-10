import { useHistory } from 'react-router-dom';
import { parseMetaMaskUrl } from '@metamask/snaps-utils';
import browser from 'webextension-polyfill';
import { getSnapRoute } from '../../helpers/utils/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  EXTENSION_MESSAGES,
  POPUP_PREPARATION_LOGIC_TYPES,
} from '../../../shared/constants/app';

const useSnapNavigation = () => {
  const history = useHistory();
  const navigate = (url: string, envType: string, onCancel?: () => void) => {
    let path;
    const linkData = parseMetaMaskUrl(url);
    if (linkData.snapId) {
      path = getSnapRoute(linkData.snapId);
    } else {
      path = linkData.path;
    }
    if (envType === ENVIRONMENT_TYPE_NOTIFICATION) {
      browser.runtime.sendMessage({
        type: EXTENSION_MESSAGES.OPEN_EXTENSION_POPUP_FROM_NOTIFICATION,
        action: POPUP_PREPARATION_LOGIC_TYPES.SNAP_NAVIGATION,
        params: { path },
      });
      onCancel?.();
    } else {
      history.push(path);
    }
  };
  return {
    navigate,
  };
};

export default useSnapNavigation;
