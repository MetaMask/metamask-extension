import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import {
  getAllChainsToPoll,
  getIsLineaMainnet,
  getIsMainnet,
  getTokenNetworkFilter,
  getUseNftDetection,
} from '../../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
import { SelectableListItem } from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
} from '../../../../../store/actions';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  ASSETS_ROUTE,
  IMPORT_NFTS_ROUTE,
} from '../../../../../helpers/constants/routes';
import { useDispatch } from '../../../../../store/hooks';
import { useAssetControls } from './asset-controls';
import { ManageTokensButton } from './manage-tokens-button';
import { OptionsMenu } from './options-menu';
import { RefreshItem } from './refresh-item';

const EvmNftOptionsMenu = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { close } = useAssetControls();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const isLineaMainnet = useSelector(getIsLineaMainnet);
  const allChainIds = useSelector(getAllChainsToPoll);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const { collections } = useNftsCollections();

  const allNetworkClientIds = useMemo(() => {
    return Object.keys(tokenNetworkFilter).flatMap((chainId) => {
      const entry = allNetworks[chainId as `0x${string}`];
      if (!entry) {
        return [];
      }
      const index = entry.defaultRpcEndpointIndex;
      const endpoint = entry.rpcEndpoints[index];
      return endpoint?.networkClientId ? [endpoint.networkClientId] : [];
    });
  }, [tokenNetworkFilter, allNetworks]);

  const shouldShowRefreshButtons =
    (isMainnet || isLineaMainnet || Object.keys(collections).length > 0) &&
    useNftDetection;

  const handleNftImportModal = () => {
    navigate(IMPORT_NFTS_ROUTE);
    close();
  };

  const handleNftRefresh = () => {
    if (isMainnet || isLineaMainnet) {
      dispatch(detectNfts(allChainIds));
    }
    allNetworkClientIds.forEach((networkClientId) => {
      checkAndUpdateAllNftsOwnershipStatus(networkClientId);
    });
    close();
  };

  return (
    <OptionsMenu>
      <SelectableListItem onClick={handleNftImportModal} testId="import-nfts">
        <Icon name={IconName.Add} size={IconSize.Sm} className="mr-2" />
        {t('importNFT')}
      </SelectableListItem>
      {shouldShowRefreshButtons && <RefreshItem onClick={handleNftRefresh} />}
      {!useNftDetection && (
        <SelectableListItem
          onClick={() => navigate(`${ASSETS_ROUTE}#autodetect-tokens`)}
          testId="enable-autodetect-button"
        >
          <Icon name={IconName.Setting} size={IconSize.Sm} className="mr-2" />
          {t('enableAutoDetect')}
        </SelectableListItem>
      )}
    </OptionsMenu>
  );
};

/**
 * NFT more-menu: import, refresh, and autodetect. A non-EVM account has no NFT
 * menu, so this renders the manage-tokens shortcut instead.
 */
export const NftOptionsMenu = () => {
  const isEvm = useSelector(getMultichainIsEvm);
  if (!isEvm) {
    return <ManageTokensButton />;
  }
  return <EvmNftOptionsMenu />;
};
