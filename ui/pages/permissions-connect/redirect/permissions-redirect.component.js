import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Display,
  JustifyContent,
  AlignItems,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';

export default function PermissionsRedirect({ subjectMetadata }) {
  const t = useContext(I18nContext);

  return (
    <div className="permissions-redirect">
      <div className="permissions-redirect__result">
        <Text variant={TextVariant.headingMd} marginBottom={2}>
          {t('connecting')}
        </Text>
        <div className="permissions-redirect__icons">
          <AvatarFavicon
            src={subjectMetadata.iconUrl}
            name={subjectMetadata.name}
            size={AvatarFaviconSize.Xl}
          />
          <Box
            className="permissions-redirect__center-icon"
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <Icon
              name={IconName.Check}
              size={IconSize.Lg}
              className="permissions-redirect__check"
            />
            <div className="permissions-redirect__dashed-line" />
          </Box>
          <AvatarFavicon
            src="/images/logo/metamask-fox.svg"
            size={AvatarFaviconSize.Xl}
          />
        </div>
      </div>
    </div>
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
