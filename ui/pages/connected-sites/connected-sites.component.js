import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import ConnectedSitesList from '../../components/app/connected-sites-list';
import Popover from '../../components/ui/popover/popover.component';
import { Button, ButtonVariant } from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';

export default function ConnectedSites({
  accountLabel,
  closePopover,
  connectedSubjects,
  disconnectAllAccounts,
  disconnectAccount,
  getOpenMetamaskTabsIds,
  permittedAccountsByOrigin,
  tabToConnect = null,
  requestAccountsPermission,
}) {
  const t = useI18nContext();
  const [sitePendingDisconnect, setSitePendingDisconnect] = useState(null);

  useEffect(() => {
    getOpenMetamaskTabsIds();
  }, [getOpenMetamaskTabsIds]);

  const clearPendingDisconnect = useCallback(() => {
    setSitePendingDisconnect(null);
  }, []);

  const setPendingDisconnect = useCallback((subjectKey) => {
    setSitePendingDisconnect({ subjectKey });
  }, []);

  const handleDisconnectAccount = useCallback(() => {
    disconnectAccount(sitePendingDisconnect.subjectKey);
    clearPendingDisconnect();
  }, [
    clearPendingDisconnect,
    disconnectAccount,
    sitePendingDisconnect?.subjectKey,
  ]);

  const handleDisconnectAllAccounts = useCallback(() => {
    disconnectAllAccounts(sitePendingDisconnect.subjectKey);
    clearPendingDisconnect();
  }, [
    clearPendingDisconnect,
    disconnectAllAccounts,
    sitePendingDisconnect?.subjectKey,
  ]);

  const renderConnectedSitesList = () => (
    <ConnectedSitesList
      connectedSubjects={connectedSubjects}
      onDisconnect={setPendingDisconnect}
    />
  );

  const renderConnectedSitesPopover = () => (
    <Popover
      className="connected-sites"
      title={t('connectedSites')}
      subtitle={
        connectedSubjects.length
          ? t('connectedSitesDescription', [accountLabel])
          : t('connectedSitesEmptyDescription', [accountLabel])
      }
      onClose={closePopover}
      footer={
        tabToConnect ? (
          <a
            className="connected-sites__text-button"
            onClick={requestAccountsPermission}
          >
            {t('connectManually')}
          </a>
        ) : null
      }
      footerClassName="connected-sites__add-site-manually"
    >
      {renderConnectedSitesList()}
    </Popover>
  );

  const renderDisconnectPopover = () => {
    const { subjectKey } = sitePendingDisconnect;
    const numPermittedAccounts = permittedAccountsByOrigin[subjectKey].length;

    return (
      <Popover
        className="connected-sites"
        title={t('disconnectPrompt', [subjectKey])}
        subtitle={t('disconnectAllAccountsConfirmationDescription')}
        onClose={closePopover}
        footer={
          <>
            <div className="connected-sites__footer-row">
              <Button
                variant={ButtonVariant.Secondary}
                onClick={clearPendingDisconnect}
                block
              >
                {t('cancel')}
              </Button>
              <Button
                variant={ButtonVariant.Primary}
                onClick={handleDisconnectAccount}
                block
              >
                {t('disconnect')}
              </Button>
            </div>
            {numPermittedAccounts > 1 ? (
              <div className="connected-sites__footer-row">
                <a
                  className="connected-sites__text-button"
                  onClick={handleDisconnectAllAccounts}
                >
                  {t('disconnectAllAccounts')}
                </a>
              </div>
            ) : null}
          </>
        }
        footerClassName="connected-sites__confirmation"
      />
    );
  };

  return sitePendingDisconnect
    ? renderDisconnectPopover()
    : renderConnectedSitesPopover();
}

ConnectedSites.propTypes = {
  accountLabel: PropTypes.string.isRequired,
  closePopover: PropTypes.func.isRequired,
  connectedSubjects: PropTypes.arrayOf(PropTypes.object).isRequired,
  disconnectAllAccounts: PropTypes.func.isRequired,
  disconnectAccount: PropTypes.func.isRequired,
  getOpenMetamaskTabsIds: PropTypes.func.isRequired,
  permittedAccountsByOrigin: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.string),
  ).isRequired,
  tabToConnect: PropTypes.object,
  requestAccountsPermission: PropTypes.func.isRequired,
};
