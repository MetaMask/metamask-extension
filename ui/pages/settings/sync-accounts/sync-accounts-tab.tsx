import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { JustifyContent } from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import { selectQrSyncPhase } from '../../../selectors/qr-sync/qr-sync';
import SyncAccountsSettings from './sync-accounts-settings';

const SyncAccountsTab = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const qrSyncPhase = useSelector(selectQrSyncPhase);
  const hasSubmittedImport =
    qrSyncPhase === QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION ||
    qrSyncPhase === QR_SYNC_PHASES.COMPLETED;

  const handleBack = async () => {
    await submitRequestToBackground('QrSyncController:cancelSync', []).catch(
      () => undefined,
    );
    navigate(SETTINGS_ROUTE, { replace: true });
  };

  return (
    <Page
      data-testid="parent-selector-sync-accounts-page"
      className="max-w-[600px]"
    >
      <Header
        data-testid="sync-accounts-header"
        justifyContent={JustifyContent.flexStart}
        startAccessory={
          hasSubmittedImport ? undefined : (
            <ButtonIcon
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Md}
              onClick={handleBack}
              data-testid="sync-accounts-back-button"
            />
          )
        }
        marginBottom={0}
      />
      <Content className="sync-accounts">
        <SyncAccountsSettings />
      </Content>
    </Page>
  );
};

export default SyncAccountsTab;
