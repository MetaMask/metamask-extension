import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonSize,
  IconName,
  Box,
  Button,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  checkIsSeedlessPasswordOutdated,
  importMnemonicToVault,
} from '../../../store/actions';
import { SECOND } from '../../../../shared/constants/time';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Header, Page } from '../../../components/multichain/pages/page';
import {
  getIsSocialLoginFlow,
  getMetaMaskHdKeyrings,
} from '../../../selectors';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from '../../../components/app/password-outdated-modal';
import type { MetaMaskReduxDispatch } from '../../../store/types';
import { useAppDispatch } from '../../../store/hooks';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import SrpInputForm from '../../srp-input-form';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';

const toastId = 'new-srp-added-toast';
const autoHideToastDelay = 5 * SECOND;

export const ImportSrp = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [srpError, setSrpError] = useState('');
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const { trackEvent, createEventBuilder } = useAnalytics();

  async function importWallet() {
    try {
      if (!secretRecoveryPhrase) {
        return;
      }

      if (isSocialLoginEnabled) {
        const isPasswordOutdated = await dispatch(
          checkIsSeedlessPasswordOutdated(true),
        );
        if (isPasswordOutdated) {
          return;
        }
      }

      trackEvent(
        createEventBuilder(MetaMetricsEventName.ImportSecretRecoveryPhrase)
          .addProperties({
            status: 'continue_button_clicked',
            location: 'Multi SRP Import',
          })
          .build(),
      );

      await dispatch(importMnemonicToVault(secretRecoveryPhrase));

      toast.success(
        <ToastContent
          dataTestId={toastId}
          title={t('importWalletSuccess', [hdKeyrings.length + 1])}
        />,
        {
          id: toastId,
          duration: autoHideToastDelay,
        },
      );
      navigate(DEFAULT_ROUTE);
    } catch (error) {
      switch ((error as Error)?.message) {
        case 'KeyringController - The account you are trying to import is a duplicate':
          setSrpError(t('srpImportDuplicateAccountError'));
          break;
        default:
          setSrpError(t('srpAlreadyImportedError'));
          break;
      }
    }
  }

  return (
    <Page className="import-srp__multi-srp">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="back"
            iconName={IconName.ArrowLeft}
            onClick={() => {
              navigate(DEFAULT_ROUTE);
            }}
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel="close"
            iconName={IconName.Close}
            onClick={() => {
              navigate(DEFAULT_ROUTE);
            }}
          />
        }
        paddingLeft={0}
        paddingRight={0}
      >
        {t('importSecretRecoveryPhrase')}
      </Header>
      {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
      <Box className="text-left" marginBottom={2}>
        <Text variant={TextVariant.HeadingLg}>{t('importAWallet')}</Text>
      </Box>
      <SrpInputForm
        error={srpError}
        setSecretRecoveryPhrase={setSecretRecoveryPhrase}
        onClearCallback={() => setSrpError('')}
      />
      <Box className="w-full cta-footer">
        <Button
          size={ButtonSize.Lg}
          data-testid="import-srp-confirm"
          onClick={importWallet}
          disabled={!secretRecoveryPhrase.trim() || Boolean(srpError)}
          className="w-full import-srp__continue-button"
        >
          {t('continue')}
        </Button>
      </Box>
    </Page>
  );
};
