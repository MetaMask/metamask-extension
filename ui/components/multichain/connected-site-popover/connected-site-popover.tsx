import React, { useContext, useState } from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Button,
  ButtonLink,
  ButtonSecondary,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';

type ConnectedSitePopoverProp = {
  title: string;
  valueColor?: TextColor;
  value?: string | null;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement> | null;
  isConnected?: boolean;
  fullValue?: string;
};

export const ConnectedSitePopover: React.FC<ConnectedSitePopoverProp> = ({
  title,
  valueColor,
  value,
  icon,
  buttonAddressValue,
  fullValue,
  referenceElement,
  isOpen,
  networkImageUrl,
  networkName,
  isConnected,
}) => {
  const t = useContext(I18nContext);
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
      data-test-id="connected-site-popover"
    >
      <Popover
        referenceElement={referenceElement}
        isOpen={isOpen}
        position={PopoverPosition.BottomStart}
        flip
        backgroundColor={BackgroundColor.overlayAlternative}
        paddingLeft={0}
        paddingRight={0}
        style={{
          width: '256px',
        }}
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
            <Text variant={TextVariant.bodyMd}>sitename.domain.url</Text>
            {isConnected ? (
              <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
                <ButtonLink>{networkName}</ButtonLink>{' '}
                <AvatarNetwork
                  size={AvatarNetworkSize.Xs}
                  name={networkImageUrl}
                  src={networkImageUrl ?? undefined}
                />
              </Box>
            ) : (
              <Text variant={TextVariant.bodySm}>
                {t('statusNotConnected')}
              </Text>
            )}
          </Box>
          {isConnected ? null :
            <Box paddingLeft={4} paddingRight={4} paddingTop={2}>
              <Box>
                <Text variant={TextVariant.bodyMd}>
                  {t('connectionPopoverDescription')}
                </Text>
                <ButtonLink>Learn more</ButtonLink>
              </Box>
            </Box>}
          <Box paddingTop={2} paddingLeft={4} paddingRight={4}>
            <ButtonSecondary endIconName={IconName.Export} block>
              {isConnected ? t('managePermissions') : t('exploreweb3')}
            </ButtonSecondary>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};
