import React, { useCallback, useMemo, useState } from 'react';
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
import { Box, Popover, PopoverPosition } from '../../../../component-library';
import { SelectableListItem } from '../sort-control/sort-control';
import { JustifyContent } from '../../../../../helpers/constants/design-system';
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
import { OptionsButton } from './options-button';
import {
  controlPopoverStyle,
  useAssetControl,
  useIsControlBarFullScreen,
} from './asset-controls';
import { ManageTokensButton } from './manage-tokens-button';

type NftOptionsMenuProps = {
  // Forwarded to the more button. `false` keeps the NFT menu but disables the
  // button, matching an EVM token list that opts out of token links.
  showTokensLinks?: boolean;
};

const EvmNftOptionsMenu = ({ showTokensLinks }: NftOptionsMenuProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl('nfts');
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const isLineaMainnet = useSelector(getIsLineaMainnet);
  const allChainIds = useSelector(getAllChainsToPoll);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const { collections } = useNftsCollections();
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);

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

  const shouldShowRefreshButtons = useMemo(
    () =>
      (isMainnet || isLineaMainnet || Object.keys(collections).length > 0) &&
      useNftDetection,
    [isMainnet, isLineaMainnet, collections, useNftDetection],
  );
  const shouldShowEnableAutoDetect = useMemo(
    () => !shouldShowRefreshButtons && !useNftDetection,
    [shouldShowRefreshButtons, useNftDetection],
  );

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

  const onEnableAutoDetect = () => {
    navigate(`${ASSETS_ROUTE}#autodetect-tokens`);
  };

  return (
    <>
      <OptionsButton
        ref={setButtonRef}
        showTokensLinks={showTokensLinks}
        onClick={toggle}
      />
      <Popover
        onClickOutside={close}
        isOpen={isOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        matchWidth={false}
        style={controlPopoverStyle(isFullScreen, '158px')}
      >
        <SelectableListItem onClick={handleNftImportModal} testId="import-nfts">
          <Icon name={IconName.Add} size={IconSize.Sm} className="mr-2" />
          {t('importNFT')}
        </SelectableListItem>
        <Box className="nfts-tab__link" justifyContent={JustifyContent.flexEnd}>
          {shouldShowRefreshButtons && (
            <SelectableListItem
              onClick={handleNftRefresh}
              testId="refresh-list-button"
            >
              <Icon
                name={IconName.Refresh}
                size={IconSize.Sm}
                className="mr-2"
              />
              {t('refreshList')}
            </SelectableListItem>
          )}
          {shouldShowEnableAutoDetect && (
            <SelectableListItem
              onClick={onEnableAutoDetect}
              testId="enable-autodetect-button"
            >
              <Icon
                name={IconName.Setting}
                size={IconSize.Sm}
                className="mr-2"
              />
              {t('enableAutoDetect')}
            </SelectableListItem>
          )}
        </Box>
      </Popover>
    </>
  );
};

/**
 * NFT more-menu: import, refresh, and autodetect. A non-EVM account has no NFT
 * menu, so this renders the manage-tokens shortcut instead.
 *
 * @param props - The component props.
 * @param props.showTokensLinks - Disables the more button when explicitly false.
 */
export const NftOptionsMenu = ({ showTokensLinks }: NftOptionsMenuProps) => {
  const isEvm = useSelector(getMultichainIsEvm);
  if (!isEvm) {
    return <ManageTokensButton />;
  }
  return <EvmNftOptionsMenu showTokensLinks={showTokensLinks} />;
};
