import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../account-list-item';
import { I18nContext } from '../../../../contexts/i18n';

import PermissionsConnectHeader from '../../permissions-connect-header';

export default function SIWERequestHeader({ fromAccount, domain }) {
  const t = useContext(I18nContext);

  // const subjectMetadata = {
  //   iconUrl: './gnosis.svg',
  //   name: 'Gnosis - Manage Digital Assets',
  //   origin: 'https://gnosis-safe.io',
  // };

  return (
    <div className="siwe-request-header">
      <PermissionsConnectHeader
        // iconUrl={subjectMetadata.iconUrl}
        // iconName={subjectMetadata.name}
        headerTitle={t('SIWESiteRequestTitle')}
        headerText={t('SIWESiteRequestSubtitle')}
        siteOrigin={domain}
      />
      {/* <div className="title">{t('SIWESiteRequestTitle')}</div>
      <div className="subtitle">{t('SIWESiteRequestSubtitle')}</div> */}
      <div className="siwe-request-header--account">
        {fromAccount && <AccountListItem account={fromAccount} />}
      </div>
    </div>
  );
}

SIWERequestHeader.propTypes = {
  fromAccount: PropTypes.object,
  domain: PropTypes.string,
};
