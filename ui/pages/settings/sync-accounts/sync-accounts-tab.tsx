import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import SyncAccountsSettings from './sync-accounts-settings';

const SyncAccountsTab = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleBack = async () => {
    await submitRequestToBackground('messengerCall', [
      'QrSyncController:cancelSync',
      [],
    ]).catch(() => undefined);
    navigate(SETTINGS_ROUTE, { replace: true });
  };

  return (
    <Page data-testid="sync-accounts-page" className="max-w-[600px]">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="sync-accounts-back-button"
          />
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
