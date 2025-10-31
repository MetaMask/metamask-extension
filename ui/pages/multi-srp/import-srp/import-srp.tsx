import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  hideWarning,
  checkIsSeedlessPasswordOutdated,
  importMnemonicToVault,
} from '../../../store/actions';
import {
  ButtonIcon,
  ButtonSize,
  IconName,
  Box,
  Button,
  Text,
} from '../../../components/component-library';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Header, Page } from '../../../components/multichain/pages/page';
import { getIsSocialLoginFlow } from '../../../selectors';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from '../../../components/app/password-outdated-modal';
import { MetaMaskReduxDispatch } from '../../../store/store';
import SrpInputForm from '../../srp-input-form';
import {
  BlockSize,
  FlexDirection,
  AlignItems,
  Display,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';

export const ImportSrp = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const [srpError, setSrpError] = useState('');
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);

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
      await dispatch(importMnemonicToVault(secretRecoveryPhrase));
      navigate(DEFAULT_ROUTE);
      dispatch(setShowNewSrpAddedToast(true));
    } catch (error) {
      setSrpError(t('srpAlreadyImportedError'));
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
      <Box textAlign={TextAlign.Left} marginBottom={2}>
        <Text variant={TextVariant.headingLg}>{t('importAWallet')}</Text>
      </Box>
      <SrpInputForm
        error={srpError}
        setSecretRecoveryPhrase={setSecretRecoveryPhrase}
        onClearCallback={() => setSrpError('')}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        textAlign={TextAlign.Left}
      >
        <Button
          width={BlockSize.Full}
          size={ButtonSize.Lg}
          type="primary"
          data-testid="import-srp-confirm"
          onClick={importWallet}
          disabled={!secretRecoveryPhrase.trim() || Boolean(srpError)}
          className="import-srp__continue-button"
        >
          {t('continue')}
        </Button>
      </Box>
    </Page>
  );
};
