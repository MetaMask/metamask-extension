import React, { useContext, RefObject } from 'react';
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
import { getOriginOfCurrentTab } from '../../../selectors';
import { getURLHost } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { toggleNetworkMenu } from '../../../store/actions';
import { getDappActiveNetwork } from '../../../selectors/dapp';

type ConnectedSitePopoverProps = {
  referenceElement: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onClick: () => void;
};

export const ConnectedSitePopover: React.FC<ConnectedSitePopoverProps> = ({
  referenceElement,
  isOpen,
  onClose,
  isConnected,
  onClick,
}) => {
  const t = useContext(I18nContext);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const siteName = getURLHost(activeTabOrigin);
  const dispatch = useDispatch();

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
      style={{ width: '260px' }}
      onClickOutside={onClose}
      data-testid="connected-site-popover"
      paddingTop={3}
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
                    : getImageForChainId(dappActiveNetwork?.chainId)
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
                {(dappActiveNetwork as { name?: string })?.name}
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
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
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
        <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
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
