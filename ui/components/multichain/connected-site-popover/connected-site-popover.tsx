import React, { forwardRef, useContext, RefObject } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonSecondary,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { getAllDomains, getOriginOfCurrentTab } from '../../../selectors';
import { getURLHost } from '../../../helpers/utils/util';
import {
  getImageForChainId,
  getMultichainCurrentNetwork,
} from '../../../selectors/multichain';

type ConnectedSitePopoverProps = {
  isOpen: boolean;
  isConnected: boolean;
  onClick: () => void;
  referenceElement?: RefObject<HTMLElement>;
};

export const ConnectedSitePopover = forwardRef<
  HTMLDivElement,
  ConnectedSitePopoverProps
>(({ isOpen, isConnected, onClick, referenceElement }) => {
  const t = useContext(I18nContext);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const siteName = getURLHost(activeTabOrigin);
  const activeDomain = useSelector(getAllDomains);
  const networkClientId = activeDomain?.[activeTabOrigin];
  const currentNetwork = useSelector(getMultichainCurrentNetwork);

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
      data-test-id="connected-site-popover"
    >
      <Popover
        referenceElement={referenceElement?.current || undefined}
        isOpen={isOpen}
        position={PopoverPosition.BottomStart}
        flip
        backgroundColor={BackgroundColor.overlayAlternative}
        paddingLeft={0}
        paddingRight={0}
        style={{ width: '256px' }}
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
            <Text variant={TextVariant.bodyMd}>{siteName}</Text>
            {isConnected ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd}>
                  {currentNetwork?.nickname}
                </Text>
                <AvatarNetwork
                  size={AvatarNetworkSize.Xs}
                  name={currentNetwork?.nickname || ''}
                  src={
                    currentNetwork?.chainId
                      ? getImageForChainId(currentNetwork.chainId)
                      : undefined
                  }
                />
              </Box>
            ) : (
              <Text variant={TextVariant.bodySm}>
                {t('statusNotConnected')}
              </Text>
            )}
          </Box>
          {!isConnected && (
            <Box paddingLeft={4} paddingRight={4} paddingTop={2}>
              <Text variant={TextVariant.bodyMd}>
                {t('connectionPopoverDescription')}
              </Text>
            </Box>
          )}
          <Box paddingTop={2} paddingLeft={4} paddingRight={4}>
            <ButtonSecondary
              endIconName={IconName.Export}
              block
              onClick={onClick}
            >
              {isConnected ? t('managePermissions') : t('exploreweb3')}
            </ButtonSecondary>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
});
