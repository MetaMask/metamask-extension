import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  hideWarning,
  checkIsSeedlessPasswordOutdated,
  importMnemonicToVault,
} from '../../../store/actions';
import { ButtonIcon, IconName } from '../../../components/component-library';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Header, Page } from '../../../components/multichain/pages/page';
import { getIsSocialLoginFlow } from '../../../selectors';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import PasswordOutdatedModal from '../../../components/app/password-outdated-modal';
import { MetaMaskReduxDispatch } from '../../../store/store';
import OnboardingImportSRP from '../../onboarding-flow/import-srp/import-srp';

export const ImportSrp = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);

  // Providing duplicate SRP throws an error in metamask-controller, which results in a warning in the UI
  // We want to hide the warning when the component unmounts
  useEffect(() => {
    return () => {
      dispatch(hideWarning());
    };
  }, [dispatch]);

  async function importWallet(srp: string) {
    try {
      if (!srp) {
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
      await dispatch(importMnemonicToVault(srp));
      navigate(DEFAULT_ROUTE);
      dispatch(setShowNewSrpAddedToast(true));
    } catch (error) {
      console.error(error);
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
      <OnboardingImportSRP isExistingWallet onContinueCallback={importWallet} />
    </Page>
  );
};
