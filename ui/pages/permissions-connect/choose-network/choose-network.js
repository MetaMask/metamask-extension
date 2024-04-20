import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { SubjectType } from '@metamask/permission-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import PermissionsConnectHeader from '../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import AccountList from '../../../components/ui/account-list';
import { PageContainerFooter } from '../../../components/ui/page-container';

const ChooseNetwork = ({
  networkConfigurations,
  selectNetworkConfiguration,
  cancelPermissionsRequest,
  permissionsRequestId,
  targetSubjectMetadata,
  selectedNetworkConfiguration,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState(
    selectedNetworkConfiguration,
  );
  const t = useI18nContext();

  const handleNetworkClick = (network) => {
    console.log('CLIKEROONIED');
    setSelectedNetwork(network);
  };

  const getHeaderText = () => {
    return t('selectNetwork');
  };

  const headerText = getHeaderText();

  return (
    <>
      <div className="permissions-connect-choose-account__content">
        <PermissionsConnectHeader
          iconUrl={targetSubjectMetadata?.iconUrl}
          iconName={targetSubjectMetadata?.name}
          headerTitle={t('connectWithMetaMask')}
          headerText={headerText}
          siteOrigin={targetSubjectMetadata?.origin}
          subjectType={targetSubjectMetadata?.subjectType}
        />
        {networkConfigurations.map((networkConfiguration) => (
          <div onClick={() => handleNetworkClick(networkConfiguration)}>
            ChainId: {networkConfiguration.chainId}
          </div>
        ))}
      </div>
      <div className="permissions-connect-choose-account__footer-container">
        {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
          <PermissionsConnectFooter />
        )}
        <PageContainerFooter
          cancelButtonType="default"
          onCancel={() => cancelPermissionsRequest(permissionsRequestId)}
          cancelText={t('cancel')}
          onSubmit={() => selectNetworkConfiguration(selectedNetwork)}
          submitText={t('next')}
          disabled={!!selectedNetworkConfiguration}
        />
      </div>
    </>
  );
};

ChooseNetwork.propTypes = {
  /**
   * Array of user account objects
   */
  networkConfigurations: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string,
    }),
  ).isRequired,
  /**
   * Function to select an account
   */
  selectNetworkConfiguration: PropTypes.func.isRequired,
  /**
   * Function to cancel permission request
   */
  cancelPermissionsRequest: PropTypes.func.isRequired,
  /**
   * Permission request Id
   */
  permissionsRequestId: PropTypes.string.isRequired,
  /**
   * Selected Network configuration
   */
  selectedNetworkConfiguration: PropTypes.object.isRequired,
  /**
   * Domain data used to display site-origin pill
   */
  targetSubjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    subjectType: PropTypes.string,
  }),
};

export default ChooseNetwork;
