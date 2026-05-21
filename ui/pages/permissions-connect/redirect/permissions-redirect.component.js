import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  BlockSize,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import {
  AvatarToken,
  AvatarTokenSize,
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
      className="flex h-full w-full"
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
    >
      <Box
        className="flex h-full w-full rounded-sm"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        borderColor={BoxBorderColor.BorderMuted}
        borderWidth={1}
        boxShadow="var(--shadow-size-lg) var(--color-shadow-default)"
      >
        <Box className="flex" marginBottom={4}>
          <Text variant={TextVariant.headingMd}>{t('connecting')}</Text>
        </Box>
        <Box
          className="flex rounded-full"
          backgroundColor={BoxBackgroundColor.InfoMuted}
          padding={2}
        >
          <AvatarToken
            src={cachedSubjectMetadata.iconUrl}
            name={cachedSubjectMetadata.name}
            size={AvatarTokenSize.Lg}
          />
          <Box
            className="flex"
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
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
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} padding={4}>
        <Box className="flex" flexDirection={BoxFlexDirection.Column}>
          <PermissionsConnectFooter />
          <Box
            className="flex w-full"
            paddingTop={4}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
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
            />
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
