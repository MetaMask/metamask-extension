import React, { useContext, RefObject, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseCaipChainId } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonSecondary,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import {
  getOriginOfCurrentTab,
  getAllPermittedChainsForSelectedTab,
  getSelectedMultichainNetworkChainId,
} from '../../../selectors';
import {
  getSelectedMultichainNetworkConfiguration,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors/multichain/networks';
import { getURLHost } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { toggleNetworkMenu } from '../../../store/actions';

type ConnectedSitePopoverProps = {
  isOpen: boolean;
  isConnected: boolean;
  onClick: () => void;
  onClose: () => void;
  connectedOrigin: string;
  referenceElement?: RefObject<HTMLElement>;
};

export const ConnectedSitePopover = ({
  isOpen,
  isConnected,
  onClick,
  onClose,
  referenceElement,
  connectedOrigin,
}: ConnectedSitePopoverProps) => {
  const t = useContext(I18nContext);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const siteName = getURLHost(activeTabOrigin);
  // TODO: Replace it with networkClient Selector
  // const activeDomain = useSelector(getAllDomains);
  // const networkClientId = activeDomain?.[activeTabOrigin];
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const permittedChainIds = useSelector((state) =>
    getAllPermittedChainsForSelectedTab(state, connectedOrigin),
  );
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const [networkConfigurations] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const dispatch = useDispatch();

  // Get the network that the dapp is actually active on
  const dappActiveNetwork = useMemo(() => {
    if (!permittedChainIds.length) {
      return null;
    }

    // Check if current global network is permitted for this dapp
    const getCurrentChainReference = (chainId: string) => {
      try {
        // parseCaipChainId expects a CAIP-2 chainId string (e.g., "eip155:1")
        if (typeof chainId === 'string' && chainId.includes(':')) {
          const { reference } = parseCaipChainId(
            chainId as `${string}:${string}`,
          );
          return reference;
        }
        // If not a CAIP-2 string, just return as-is
        return chainId;
      } catch {
        return chainId;
      }
    };

    const currentChainReference = getCurrentChainReference(currentChainId);
    const isCurrentNetworkPermitted = permittedChainIds.some(
      (permittedChainId) => {
        const permittedChainReference =
          getCurrentChainReference(permittedChainId);
        return permittedChainReference === currentChainReference;
      },
    );

    // If current network is permitted, use it
    if (isCurrentNetworkPermitted) {
      return currentNetwork;
    }

    // Otherwise, find the network config for the first permitted chain
    const firstPermittedChainId = permittedChainIds[0];
    const permittedChainReference = getCurrentChainReference(
      firstPermittedChainId,
    );

    // Find matching network configuration
    const matchingNetwork = Object.values(networkConfigurations).find(
      (network) => {
        if (network.isEvm) {
          const networkChainReference = getCurrentChainReference(
            network.chainId,
          );
          return networkChainReference === permittedChainReference;
        }
        return network.chainId === firstPermittedChainId;
      },
    );

    return matchingNetwork || null;
  }, [
    permittedChainIds,
    currentChainId,
    currentNetwork,
    networkConfigurations,
  ]);

  const getChainIdForImage = (chainId: `${string}:${string}`): string => {
    const { namespace, reference } = parseCaipChainId(chainId);
    return namespace === 'eip155'
      ? `0x${parseInt(reference, 10).toString(16)}`
      : chainId;
  };

  return (
    <Popover
      referenceElement={referenceElement?.current}
      isOpen={isOpen}
      style={{ width: '256px' }}
      onClickOutside={onClose}
      data-testid="connected-site-popover"
      paddingLeft={0}
      paddingRight={0}
      offset={[8, 8]}
      position={PopoverPosition.BottomEnd}
      flip
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box
          style={{
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: '#858B9A33',
          }}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={2}
        >
          <Text variant={TextVariant.bodyMdMedium}>{siteName}</Text>
          {isConnected && dappActiveNetwork ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              gap={1}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                name={dappActiveNetwork?.name || ''}
                src={
                  dappActiveNetwork?.chainId?.includes(':')
                    ? getImageForChainId(
                        getChainIdForImage(
                          dappActiveNetwork.chainId as `${string}:${string}`,
                        ),
                      )
                    : undefined
                }
              />
              <ButtonLink
                size={ButtonLinkSize.Sm}
                textProps={{
                  variant: TextVariant.bodySm,
                }}
                onClick={() =>
                  dispatch(
                    toggleNetworkMenu({
                      isAccessedFromDappConnectedSitePopover: true,
                      isAddingNewNetwork: false,
                      isMultiRpcOnboarding: false,
                    }),
                  )
                }
                data-testid="connected-site-popover-network-button"
              >
                {dappActiveNetwork?.name}
              </ButtonLink>
            </Box>
          ) : (
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
            >
              {t('statusNotConnected')}
            </Text>
          )}
        </Box>
        {!isConnected && (
          <Box paddingLeft={4} paddingRight={4} paddingTop={2}>
            <Text variant={TextVariant.bodyMd}>
              {t('connectionPopoverDescription')}
            </Text>
            <ButtonLink
              href="https://support.metamask.io/more-web3/dapps/connecting-to-a-dapp/"
              externalLink
              size={ButtonLinkSize.Sm}
            >
              {t('learnMoreUpperCase')}
            </ButtonLink>
          </Box>
        )}
        <Box paddingTop={2} paddingLeft={4} paddingRight={4}>
          <ButtonSecondary
            block
            onClick={() => {
              if (isConnected) {
                onClick();
              } else {
                global.platform.openTab({
                  url: 'https://app.metamask.io/explore/dapps',
                });
              }
            }}
          >
            {isConnected ? t('managePermissions') : t('exploreweb3')}
          </ButtonSecondary>
        </Box>
      </Box>
    </Popover>
  );
};
