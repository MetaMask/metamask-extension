import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../account-list-item';
import { I18nContext } from '../../../../contexts/i18n';
import Tooltip from '../../../ui/tooltip';
import InfoIcon from '../../../ui/icon/info-icon.component';
import { SEVERITIES } from '../../../../helpers/constants/design-system';

import PermissionsConnectHeader from '../../permissions-connect-header';

export default function SIWERequestHeader({
  fromAccount,
  domain,
  isSIWEDomainValid,
  subjectMetadata,
}) {
  const t = useContext(I18nContext);

  return (
    <div className="siwe-request-header">
      <PermissionsConnectHeader
        iconUrl={subjectMetadata.iconUrl}
        iconName={subjectMetadata.name}
        headerTitle={t('SIWESiteRequestTitle')}
        headerText={t('SIWESiteRequestSubtitle')}
        siteOrigin={domain}
        className={!isSIWEDomainValid && 'bad-domain'}
        rightIcon={
          !isSIWEDomainValid && (
            <Tooltip
              position="bottom"
              html={<p>{t('SIWEWarningBody', [domain])}</p>}
              wrapperClassName="domain-warning__tooltip-wrapper"
              containerClassName="domain-warning__tooltip-container"
            >
              <div className="domain-warning__tooltip-container-icon">
                <InfoIcon severity={SEVERITIES.DANGER} />
              </div>
            </Tooltip>
          )
        }
      />
      <div className="siwe-request-header--account">
        {fromAccount && <AccountListItem account={fromAccount} />}
      </div>
    </div>
  );
}

SIWERequestHeader.propTypes = {
  fromAccount: PropTypes.object,
  domain: PropTypes.string,
  isSIWEDomainValid: PropTypes.bool,
  subjectMetadata: PropTypes.object,
};
