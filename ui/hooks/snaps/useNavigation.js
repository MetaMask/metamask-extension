import { useHistory } from 'react-router-dom';
import { getSnapRoute } from '../../helpers/utils/util';

const useNavigation = () => {
  const history = useHistory();
  const navigate = (url) => {
    try {
      let path;
      const linkData = parseMetaMaskUrl(url);
      if (linkData.snapId) {
        path = getSnapRoute(linkData.snapId);
      } else {
        path = linkData.path;
      }
      history.push(path);
    } catch (error) {
      throw new Error(error.message);
    }
  };
  return {
    navigate,
  };
};

export default useNavigation;
