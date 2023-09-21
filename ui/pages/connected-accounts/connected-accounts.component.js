import PropTypes from 'prop-types';
import React from 'react';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import Popover from '../../components/ui/popover';
import ConnectedAccountsList from '../../components/app/connected-accounts-list';
import ConnectedAccountsPermissions from '../../components/app/connected-accounts-permissions';
import { getURLHost } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import ConnectedSnaps from '../../components/app/connected-sites-list/connected-snaps';
import { TextVariant } from '../../helpers/constants/design-system';
import { Box, Text } from '../../components/component-library';

export default function ConnectedAccounts({
  accountToConnect = null,
  activeTabOrigin,
  isActiveTabExtension,
  connectAccount,
  connectedAccounts,
  history,
  mostRecentOverviewPage,
  permissions = undefined,
  selectedAddress,
  removePermittedAccount,
  setSelectedAddress,
  subjectMetadata,
  originOfActiveTab,
  permissionSubjects,
}) {
  const t = useI18nContext();
  const connectedSubjectsMetadata = subjectMetadata[originOfActiveTab];
  const isPermissionSubject =
    permissionSubjects[originOfActiveTab]?.origin ===
      connectedSubjectsMetadata?.origin &&
    permissionSubjects[originOfActiveTab]?.permissions[
      WALLET_SNAP_PERMISSION_KEY
    ];

  const connectedPermissionSubjects =
    isPermissionSubject &&
    Object.keys(
      permissionSubjects[originOfActiveTab]?.permissions?.wallet_snap
        ?.caveats[0]?.value,
    );
  const connectedPermissionSubjectsMetaData =
    isPermissionSubject &&
    connectedPermissionSubjects?.map((sub) => subjectMetadata[sub]);

  const connectedAccountsDescription =
    connectedAccounts.length > 0
      ? t('connectedAccountsDescriptionPlural', [connectedAccounts.length])
      : t('connectedAccountsDescriptionSingular');

  let subtitle;
  if (connectedAccounts.length && !isPermissionSubject) {
    subtitle = connectedAccountsDescription;
  } else if (isPermissionSubject && !connectedAccounts.length) {
    subtitle = t('connectedSnapAndNoAccountDescription');
  } else if (connectedAccounts && isPermissionSubject) {
    subtitle = t('connectedAccountsAndSnapDescription', [
      connectedAccounts.length,
      connectedPermissionSubjects.length,
    ]);
  } else {
    subtitle = t('connectedAccountsEmptyDescription');
  }

  return (
    <Popover
      title={
        isActiveTabExtension
          ? t('currentExtension')
          : getURLHost(activeTabOrigin)
      }
      subtitle={subtitle}
      onClose={() => history.push(mostRecentOverviewPage)}
      footerClassName="connected-accounts__footer"
      footer={
        connectedAccounts.length > 0 && ( // show permissions only for connected accounts not snaps
          <ConnectedAccountsPermissions permissions={permissions} />
        )
      }
    >
      <Box>
        {connectedAccounts.length > 0 ? (
          <Box marginLeft={6}>
            <Text variant={TextVariant.bodyLgMedium}>
              {t('accountsConnected')}&nbsp;({connectedAccounts.length})
            </Text>
          </Box>
        ) : null}

        <ConnectedAccountsList
          accountToConnect={accountToConnect}
          connectAccount={connectAccount}
          connectedAccounts={connectedAccounts}
          selectedAddress={selectedAddress}
          removePermittedAccount={removePermittedAccount}
          setSelectedAddress={setSelectedAddress}
          shouldRenderListOptions
        />
      </Box>
      {isPermissionSubject &&
        connectedPermissionSubjectsMetaData.length > 0 && (
          <Box>
            <Box marginLeft={6}>
              <Text variant={TextVariant.bodyLgMedium}>
                {t('snapsConnected')}&nbsp;({connectedPermissionSubjects.length}
                )
              </Text>
            </Box>
            <ConnectedSnaps
              connectedSubjects={connectedPermissionSubjectsMetaData}
            />
          </Box>
        )}
    </Popover>
  );
}

ConnectedAccounts.propTypes = {
  accountToConnect: PropTypes.object,
  activeTabOrigin: PropTypes.string.isRequired,
  connectAccount: PropTypes.func.isRequired,
  connectedAccounts: PropTypes.array.isRequired,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  permissions: PropTypes.array,
  isActiveTabExtension: PropTypes.bool.isRequired,
  selectedAddress: PropTypes.string.isRequired,
  removePermittedAccount: PropTypes.func.isRequired,
  setSelectedAddress: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  subjectMetadata: PropTypes.arrayOf(PropTypes.object).isRequired,
  originOfActiveTab: PropTypes.string,
  permissionSubjects: PropTypes.object,
};
