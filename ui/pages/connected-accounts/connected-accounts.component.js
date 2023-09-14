import PropTypes from 'prop-types';
import React from 'react';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import { SnapCaveatType } from '@metamask/rpc-methods-flask';
import { useDispatch } from 'react-redux';
import Popover from '../../components/ui/popover';
import ConnectedAccountsList from '../../components/app/connected-accounts-list';
import ConnectedAccountsPermissions from '../../components/app/connected-accounts-permissions';
import { getURLHost } from '../../helpers/utils/util';
import ConnectedSitesList from '../../components/app/connected-sites-list';
import { removePermissionsFor, updateCaveat } from '../../store/actions';
import { useI18nContext } from '../../hooks/useI18nContext';

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
  const dispatch = useDispatch();
  const connectedSubjectsMetadata = subjectMetadata[originOfActiveTab];
  const isPermissionSubject =
    permissionSubjects[originOfActiveTab]?.origin ===
    connectedSubjectsMetadata?.origin;
  const connectedSubjects = [connectedSubjectsMetadata];

  const onDisconnect = (connectedOrigin) => {
    const caveatValue =
      permissionSubjects[connectedOrigin].permissions[
        WALLET_SNAP_PERMISSION_KEY
      ].caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    if (Object.keys(newCaveatValue) > 0) {
      dispatch(
        updateCaveat(
          connectedOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
    }
  };

  const connectedAccountsDescription =
    connectedAccounts.length > 0
      ? t('connectedAccountsDescriptionPlural', [connectedAccounts.length])
      : t('connectedAccountsDescriptionSingular');

  return (
    <Popover
      title={
        isActiveTabExtension
          ? t('currentExtension')
          : getURLHost(activeTabOrigin)
      }
      subtitle={
        connectedAccounts.length
          ? connectedAccountsDescription
          : t('connectedAccountsEmptyDescription')
      }
      onClose={() => history.push(mostRecentOverviewPage)}
      footerClassName="connected-accounts__footer"
      footer={
        permissions?.length > 0 && (
          <ConnectedAccountsPermissions permissions={permissions} />
        )
      }
    >
      <ConnectedAccountsList
        accountToConnect={accountToConnect}
        connectAccount={connectAccount}
        connectedAccounts={connectedAccounts}
        selectedAddress={selectedAddress}
        removePermittedAccount={removePermittedAccount}
        setSelectedAddress={setSelectedAddress}
        shouldRenderListOptions
      />
      {isPermissionSubject && connectedSubjects.length > 0 && (
        <ConnectedSitesList
          connectedSubjects={connectedSubjects}
          onDisconnect={() => onDisconnect(originOfActiveTab)}
        />
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
