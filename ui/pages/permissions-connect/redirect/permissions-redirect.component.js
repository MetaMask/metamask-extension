import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import SiteIcon from '../../../components/ui/site-icon';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography/typography';
import {
  TypographyVariant,
  DISPLAY,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';

export default function PermissionsRedirect({ subjectMetadata }) {
  const t = useContext(I18nContext);

  return (
    <div className="permissions-redirect">
      <div className="permissions-redirect__result">
        <Typography
          boxProps={{ marginBottom: 4 }}
          variant={TypographyVariant.H3}
        >
          {t('connecting')}
        </Typography>
        <div className="permissions-redirect__icons">
          <SiteIcon
            icon={subjectMetadata.iconUrl}
            name={subjectMetadata.name}
            size={64}
            className="permissions-redirect__site-icon"
          />
          <Box
            className="permissions-redirect__center-icon"
            display={DISPLAY.FLEX}
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
          <SiteIcon
            icon="/images/logo/metamask-fox.svg"
            size={64}
            className="permissions-redirect__site-icon"
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
