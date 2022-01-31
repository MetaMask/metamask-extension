import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import SiteIcon from '../../../components/ui/site-icon';
import { I18nContext } from '../../../contexts/i18n';

export default function PermissionsRedirect({ subjectMetadata }) {
  const t = useContext(I18nContext);

  return (
    <div className="permissions-redirect">
      <div className="permissions-redirect__result">
        {t('connecting')}
        <div className="permissions-redirect__icons">
          <SiteIcon
            icon={subjectMetadata.iconUrl}
            name={subjectMetadata.name}
            size={64}
          />
          <div className="permissions-redirect__center-icon">
            <span className="permissions-redirect__check" />
            {renderBrokenLine()}
          </div>
          <SiteIcon icon="/images/logo/metamask-fox.svg" size={64} />
        </div>
      </div>
    </div>
  );

  function renderBrokenLine() {
    return (
      <svg
        width="131"
        height="2"
        viewBox="0 0 131 2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 1H134"
          stroke="#CDD1E4"
          strokeLinejoin="round"
          strokeDasharray="8 7"
        />
      </svg>
    );
  }
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
