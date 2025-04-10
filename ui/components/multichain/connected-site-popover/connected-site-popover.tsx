import React, { useContext, RefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonSecondary,
  IconName,
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
import { getCurrentNetwork, getOriginOfCurrentTab } from '../../../selectors';
import { getURLHost } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { toggleNetworkMenu } from '../../../store/actions';

type ConnectedSitePopoverProps = {
  isOpen: boolean;
  isConnected: boolean;
  onClick: () => void;
  onClose: () => void;
  referenceElement?: RefObject<HTMLElement>;
};

export const ConnectedSitePopover = ({
  isOpen,
  isConnected,
  onClick,
  onClose,
  referenceElement,
}: ConnectedSitePopoverProps) => {
  const t = useContext(I18nContext);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const siteName = getURLHost(activeTabOrigin);
  // TODO: Replace it with networkClient Selector
  // const activeDomain = useSelector(getAllDomains);
  // const networkClientId = activeDomain?.[activeTabOrigin];
  const currentNetwork = useSelector(getCurrentNetwork);
  const dispatch = useDispatch();

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
          {isConnected ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              gap={1}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                name={currentNetwork?.nickname || ''}
                src={
                  currentNetwork?.chainId
                    ? getImageForChainId(currentNetwork.chainId)
                    : undefined
                }
              />
              <ButtonLink onClick={() => dispatch(toggleNetworkMenu())}>
                {currentNetwork?.nickname}
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
            endIconName={IconName.Export}
            block
            onClick={() => {
              if (isConnected) {
                onClick();
              } else {
                global.platform.openTab({
                  url: 'https://portfolio.metamask.io/explore/dapps',
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
