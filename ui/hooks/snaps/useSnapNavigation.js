import { useHistory } from 'react-router-dom';
import { parseMetaMaskUrl } from '@metamask/snaps-utils';
import { getSnapRoute } from '../../helpers/utils/util';

const useSnapNavigation = () => {
  const history = useHistory();
  const navigate = (url) => {
    let path;
    const linkData = parseMetaMaskUrl(url);
    if (linkData.snapId) {
      path = getSnapRoute(linkData.snapId);
    } else {
      path = linkData.path;
    }
    history.push(path);
  };
  return {
    navigate,
  };
};

export default useSnapNavigation;
