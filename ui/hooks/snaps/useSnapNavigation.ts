import { useNavigate } from 'react-router-dom-v5-compat';
import { parseMetaMaskUrl } from '@metamask/snaps-utils';
import { getSnapRoute } from '../../helpers/utils/util';

const useSnapNavigation = () => {
  const navigate = useNavigate();
  const useSnapNavigate = (url: string) => {
    let path;
    const linkData = parseMetaMaskUrl(url);
    if (linkData.snapId) {
      path = getSnapRoute(linkData.snapId);
    } else {
      path = linkData.path;
    }
    navigate(path);
  };
  return {
    useSnapNavigate,
  };
};

export default useSnapNavigation;
