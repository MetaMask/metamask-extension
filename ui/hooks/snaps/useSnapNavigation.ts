import { useHistory } from 'react-router-dom';
import { parseMetaMaskUrl } from '@metamask/snaps-utils';
import { getSnapRoute } from '../../helpers/utils/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';

const useSnapNavigation = () => {
  const history = useHistory();
  const navigate = (url: string, envType: string, onCancel: () => void) => {
    let path;
    const linkData = parseMetaMaskUrl(url);
    if (linkData.snapId) {
      path = getSnapRoute(linkData.snapId);
    } else {
      path = linkData.path;
    }
    if (envType === ENVIRONMENT_TYPE_NOTIFICATION) {
      onCancel?.();
      global.platform?.openExtensionInBrowser?.(path);
    } else {
      history.push(path);
    }
  };
  return {
    navigate,
  };
};

export default useSnapNavigation;
