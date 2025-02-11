import { useSelector } from 'react-redux';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getIsTestnet,
  getSelectedAccount,
  getShowFiatInTestnets,
} from '../../../../selectors';
import { getMultichainShouldShowFiat } from '../../../../selectors/multichain';

const useShouldShowFiat = () => {
  const isTestnet = useSelector(getIsTestnet);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );

  const isMainnet = !isTestnet;
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);

  return shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));
};

export default useShouldShowFiat;
