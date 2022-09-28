import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../account-list-item';
import { I18nContext } from '../../../../contexts/i18n';
import PermissionsConnectHeader from '../../permissions-connect-header';
import SignatureRequestSIWEIcon from '../signature-request-siwe-icon';
import SignatureRequestSIWETag from '../signature-request-siwe-tag';

export default function SignatureRequestSIWEHeader({
  fromAccount,
  domain,
  isSIWEDomainValid,
  subjectMetadata,
}) {
  const t = useContext(I18nContext);

  return (
    <div className="signature-request-siwe-header">
      <PermissionsConnectHeader
        iconUrl={subjectMetadata.iconUrl}
        iconName={subjectMetadata.name}
        headerTitle={t('SIWESiteRequestTitle')}
        headerText={t('SIWESiteRequestSubtitle')}
        siteOrigin={domain}
        className={isSIWEDomainValid ? '' : 'bad-domain'}
        leftIcon={
          !isSIWEDomainValid && <SignatureRequestSIWEIcon domain={domain} />
        }
        rightIcon={
          !isSIWEDomainValid && <SignatureRequestSIWETag domain={domain} />
        }
      />
      {fromAccount && (
        <AccountListItem
          account={fromAccount}
          className="signature-request-siwe-header__account-list-item"
        />
      )}
    </div>
  );
}

SignatureRequestSIWEHeader.propTypes = {
  /**
   * The account that is requesting permissions
   */
  fromAccount: PropTypes.object,
  /**
   * The domain that the request is for
   */
  domain: PropTypes.string,
  /**
   * Whether the domain is valid
   */
  isSIWEDomainValid: PropTypes.bool,
  /**
   * The metadata for the subject. This is used to display the icon and name
   * and is selected from the domain in the SIWE request.
   */
  subjectMetadata: PropTypes.object,
};
