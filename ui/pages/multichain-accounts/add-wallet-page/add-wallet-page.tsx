import React, { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ImportAccount } from '../../../components/multichain/import-account/import-account';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';

const toastId = 'account-imported-toast';
const autoHideToastDelay = 5 * SECOND;

/**
 *
 * TODO: This page will eventually handle both SRP and Private Key account imports
 * For now, it only handles Private Key account imports
 */
export const AddWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const onActionComplete = useCallback(
    async (confirmed?: boolean) => {
      if (confirmed === true) {
        toast.success(
          <ToastContent dataTestId={toastId} title={t('accountImported')} />,
          {
            id: toastId,
            duration: autoHideToastDelay,
          },
        );
        navigate(DEFAULT_ROUTE);
        return;
      }

      // Navigate back if the user cancelled (undefined). Stay on the page if
      // import failed (false) so they can retry.
      if (confirmed !== false) {
        navigate(PREVIOUS_ROUTE);
      }
    },
    [navigate, t],
  );

  return (
    <Page>
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
            data-testid="add-wallet-page-back-button"
          />
        }
      >
        {t('addWallet')}
      </Header>
      <Content>
        <Text variant={TextVariant.HeadingSm}>{t('privateKey')}</Text>
        <ImportAccount onActionComplete={onActionComplete} />
      </Content>
    </Page>
  );
};
