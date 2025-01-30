import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  JustifyContent,
  AlignItems,
  Display,
  TextVariant,
  BlockSize,
  FlexDirection,
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';

export default function PermissionsRedirect({ subjectMetadata }) {
  const t = useContext(I18nContext);
  const [cachedSubjectMetadata, setCachedSubjectMetadata] =
    useState(subjectMetadata);

  // While this redirecting screen is showing, the subject metadata will become invalidated
  // for that reason we cache the last seen valid subject metadata and show that.
  useEffect(() => {
    if (subjectMetadata && subjectMetadata.origin) {
      setCachedSubjectMetadata(subjectMetadata);
    }
  }, [subjectMetadata]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      height={BlockSize.Full}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        width={BlockSize.Full}
        height={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <Box display={Display.Flex} marginBottom={4}>
          <Text variant={TextVariant.headingMd}>{t('connecting')}</Text>
        </Box>
        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.infoMuted}
          borderRadius={BorderRadius.pill}
          padding={2}
        >
          <AvatarToken
            src={cachedSubjectMetadata.iconUrl}
            name={cachedSubjectMetadata.name}
            size={AvatarTokenSize.Lg}
          />
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            paddingLeft={4}
            paddingRight={4}
          >
            <Icon
              name={IconName.Confirmation}
              size={IconSize.Xl}
              color={IconColor.infoDefault}
            />
          </Box>
          <AvatarToken
            src="/images/logo/metamask-fox.svg"
            size={AvatarTokenSize.Lg}
            name="metamask-fox"
          />
        </Box>
      </Box>
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <PermissionsConnectFooter />
          <Box
            display={Display.Flex}
            paddingTop={4}
            width={BlockSize.Full}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              width={BlockSize.Full}
              marginRight={2}
              disabled
            >
              {t('back')}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              width={BlockSize.Full}
              marginLeft={2}
              disabled
              loading
            >
              <Icon
                name={IconName.Loading}
                size={IconSize.Lg}
                color={IconColor.infoDefault}
              />
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

PermissionsRedirect.propTypes = {
  subjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    subjectType: PropTypes.string,
    name: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
  }),
};
