import { useSelector } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../../../../../shared/modules/selectors/networks';

export default function useTranslatedNetworkName() {
  const chainId = useSelector(getCurrentChainId);
  const t = useI18nContext();

  switch (toHex(chainId)) {
    case CHAIN_IDS.MAINNET:
      return t('networkNameEthereum');
    case CHAIN_IDS.BSC:
      return t('networkNameBSC');
    case CHAIN_IDS.POLYGON:
      return t('networkNamePolygon');
    case CHAIN_IDS.LOCALHOST:
      return t('networkNameTestnet');
    case CHAIN_IDS.GOERLI:
      return t('networkNameGoerli');
    case CHAIN_IDS.AVALANCHE:
      return t('networkNameAvalanche');
    case CHAIN_IDS.OPTIMISM:
      return t('networkNameOpMainnet');
    case CHAIN_IDS.ARBITRUM:
      return t('networkNameArbitrum');
    case CHAIN_IDS.ZKSYNC_ERA:
      return t('networkNameZkSyncEra');
    case CHAIN_IDS.LINEA_MAINNET:
      return t('networkNameLinea');
    case CHAIN_IDS.BASE:
      return t('networkNameBase');
    default:
      return undefined;
  }
}
