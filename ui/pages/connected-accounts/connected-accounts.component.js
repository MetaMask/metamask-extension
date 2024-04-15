import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import Popover from '../../components/ui/popover';
import ConnectedAccountsList from '../../components/app/connected-accounts-list';
import ConnectedAccountsPermissions from '../../components/app/connected-accounts-permissions';
import { getURLHost } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import ConnectedSnaps from '../../components/app/connected-sites-list/connected-snaps';
import { TextColor, TextVariant } from '../../helpers/constants/design-system';
import { Box, Text } from '../../components/component-library';
import { getInternalAccounts } from '../../selectors';

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
  setSelectedAccount,
  subjectMetadata,
  originOfActiveTab,
  permissionSubjects,
}) {
  const t = useI18nContext();
  const internalAccounts = useSelector(getInternalAccounts);
  const connectedSubjectsMetadata = subjectMetadata[originOfActiveTab];
  const subjectHasSnaps =
    permissionSubjects[originOfActiveTab]?.origin ===
      connectedSubjectsMetadata?.origin &&
    permissionSubjects[originOfActiveTab]?.permissions[
      WALLET_SNAP_PERMISSION_KEY
    ];

  const connectedSnaps =
    subjectHasSnaps &&
    Object.keys(
      permissionSubjects[originOfActiveTab]?.permissions?.wallet_snap
        ?.caveats[0]?.value,
    );
  const connectedSnapsMetaData =
    subjectHasSnaps && connectedSnaps?.map((sub) => subjectMetadata[sub]);

  const connectedAccountsDescription =
    connectedAccounts.length > 0
      ? t('connectedAccountsDescriptionPlural', [connectedAccounts.length])
      : t('connectedAccountsDescriptionSingular');

  let subtitle;
  if (connectedAccounts.length && !subjectHasSnaps) {
    subtitle = connectedAccountsDescription;
  } else if (subjectHasSnaps && !connectedAccounts.length) {
    subtitle = t('connectedSnapAndNoAccountDescription');
  } else if (connectedAccounts && subjectHasSnaps) {
    subtitle = null;
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
      headerProps={{
        paddingLeft: 4,
        paddingRight: 4,
      }}
      subtitle={subtitle}
      onClose={() => history.push(mostRecentOverviewPage)}
      footerClassName="connected-accounts__footer"
      ConnectedAccountsPermissions={{}}
      footer={
        connectedAccounts.length > 0 && ( // show permissions only for connected accounts not snaps
          <ConnectedAccountsPermissions permissions={permissions} />
        )
      }
    >
      <Box>
        {connectedAccounts.length > 0 ? (
          <Box marginLeft={4}>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
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
          setSelectedAddress={(address) => {
            const { id: accountId } = internalAccounts.find(
              (internalAccount) => internalAccount.address === address,
            );
            setSelectedAccount(accountId);
          }}
          shouldRenderListOptions
        />
      </Box>
      {subjectHasSnaps && connectedSnapsMetaData.length > 0 && (
        <>
          <Box marginLeft={4}>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {t('snapsConnected')}&nbsp;({connectedSnaps.length})
            </Text>
          </Box>
          <ConnectedSnaps connectedSubjects={connectedSnapsMetaData} />
        </>
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
  setSelectedAccount: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  subjectMetadata: PropTypes.arrayOf(PropTypes.object).isRequired,
  originOfActiveTab: PropTypes.string,
  permissionSubjects: PropTypes.object,
};
