import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import SiteIcon from '../../../components/ui/site-icon';
import Typography from '../../../components/ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';

export default function PermissionsRedirect({ subjectMetadata }) {
  const t = useContext(I18nContext);

  return (
    <div className="permissions-redirect">
      <div className="permissions-redirect__result">
        <Typography boxProps={{ marginBottom: 4 }} variant={TYPOGRAPHY.H3}>
          {t('connecting')}
        </Typography>
        <div className="permissions-redirect__icons">
          <SiteIcon
            icon={subjectMetadata.iconUrl}
            name={subjectMetadata.name}
            size={64}
            className="permissions-redirect__site-icon"
          />
          <div className="permissions-redirect__line">
            <i className="fa fa-check-circle fa-2x permissions-redirect__check" />
          </div>
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
