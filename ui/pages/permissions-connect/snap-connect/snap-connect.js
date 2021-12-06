import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import { PageContainerFooter } from '../../../components/ui/page-container';
import PermissionConnectHeader from '../../../components/app/permissions-connect-header';
import { useI18nContext } from '../../../hooks/useI18nContext';

const SnapConnect = ({ iconUrl, iconName, snapOrigin, accounts }) => {
  const t = useI18nContext();
  const onCancel = useCallback(() => {}, []);
  const onSubmit = useCallback(() => {}, []);
  return (
    <div className="page-container snap-connect">
      <PermissionConnectHeader
        icon={iconUrl}
        iconName={iconName}
        headerTitle={t('connectWithMetaMask')}
        headerText={
          accounts.length > 0 ? t('chooseAccounts') : t('createAccount')
        }
        siteOrigin={snapOrigin}
      />
      <PermissionsConnectFooter />
      <PageContainerFooter
        cancelButtonType="default"
        onCancel={onCancel}
        onSubmit={onSubmit}
        buttonsSizeLarge={false}
      />
    </div>
  );
};

SnapConnect.propTypes = {
  /**
   * Snap icon url
   */
  iconUrl: PropTypes.string,
  /**
   * Icon name (to be used for fallback icon)
   */
  iconName: PropTypes.string,
  /**
   * The url of where the snap orginates from
   */
  snapOrigin: PropTypes.string,
  /**
   * Array of user account objects
   */
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string,
      addressLabel: PropTypes.string,
      lastConnectedDate: PropTypes.string,
      balance: PropTypes.string,
    }),
  ).isRequired,
};

export default SnapConnect;
