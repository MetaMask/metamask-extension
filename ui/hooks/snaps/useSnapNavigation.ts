import { useNavigate } from 'react-router-dom-v5-compat';
import { parseMetaMaskUrl } from '@metamask/snaps-utils';
import { getSnapRoute } from '../../helpers/utils/util';

const useSnapNavigation = () => {
  const useNavigateHook = useNavigate();
  const navigate = (url: string) => {
    let path;
    const linkData = parseMetaMaskUrl(url);
    if (linkData.snapId) {
      path = getSnapRoute(linkData.snapId);
    } else {
      path = linkData.path;
    }
    useNavigateHook(path);
  };
  return {
    navigate,
  };
};

export default useSnapNavigation;
