import React, { useEffect, useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  hideWarning,
  checkIsSeedlessPasswordOutdated,
  importMnemonicToVault,
} from '../../../store/actions';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Header, Page } from '../../../components/multichain/pages/page';
import {
  getIsSocialLoginFlow,
  getMetaMaskHdKeyrings,
} from '../../../selectors';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from '../../../components/app/password-outdated-modal';
import { MetaMaskReduxDispatch } from '../../../store/store';
import SrpInputForm from '../../srp-input-form';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';

export const ImportSrp = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const [srpError, setSrpError] = useState('');
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const { trackEvent } = useContext(MetaMetricsContext);

  // Providing duplicate SRP throws an error in metamask-controller, which results in a warning in the UI
  // We want to hide the warning when the component unmounts
  useEffect(() => {
    return () => {
      dispatch(hideWarning());
    };
  }, [dispatch]);

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

      trackEvent({
        event: MetaMetricsEventName.ImportSecretRecoveryPhrase,
        properties: {
          status: 'continue_button_clicked',
          location: 'Multi SRP Import',
        },
      });

      await dispatch(importMnemonicToVault(secretRecoveryPhrase));

      navigate(DEFAULT_ROUTE);
      dispatch(setShowNewSrpAddedToast(hdKeyrings.length + 1));
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
      <Box className="w-full">
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
