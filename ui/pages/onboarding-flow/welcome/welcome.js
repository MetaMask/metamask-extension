import EventEmitter from 'events';
import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Carousel } from 'react-responsive-carousel';
// eslint-disable-next-line import/no-restricted-paths
import { getPlatform } from '../../../../app/scripts/lib/util';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import { Text } from '../../../components/component-library';
import CheckBox from '../../../components/ui/check-box';
import Box from '../../../components/ui/box';
import {
  TextVariant,
  AlignItems,
  TextAlign,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  setFirstTimeFlowType,
  setTermsOfUseLastAgreed,
} from '../../../store/actions';
import {
  ONBOARDING_METAMETRICS,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
} from '../../../helpers/constants/routes';
import { getFirstTimeFlowType, getCurrentKeyring } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { isFlask, isBeta } from '../../../helpers/utils/build-types';

export default function OnboardingWelcome() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [eventEmitter] = useState(new EventEmitter());
  const currentKeyring = useSelector(getCurrentKeyring);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [termsChecked, setTermsChecked] = useState(false);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);

  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.restore
      ) {
        navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
      } else {
        navigate(ONBOARDING_SECURE_YOUR_WALLET_ROUTE, { replace: true });
      }
    }
  }, [
    currentKeyring,
    navigate,
    firstTimeFlowType,
    newAccountCreationInProgress,
  ]);
  const trackEvent = useContext(MetaMetricsContext);

  const onCreateClick = async () => {
    setNewAccountCreationInProgress(true);
    dispatch(setFirstTimeFlowType(FirstTimeFlowType.create));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletCreationStarted,
      properties: {
        account_type: 'metamask',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

    navigate(
      getPlatform() === PLATFORM_FIREFOX
        ? ONBOARDING_CREATE_PASSWORD_ROUTE
        : ONBOARDING_METAMETRICS,
    );
  };
  const toggleTermsCheck = () => {
    setTermsChecked((currentTermsChecked) => !currentTermsChecked);
  };
  const termsOfUse = t('agreeTermsOfUse', [
    <a
      className="create-new-vault__terms-link"
      key="create-new-vault__link-text"
      href="https://metamask.io/terms.html"
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('terms')}
    </a>,
  ]);

  const onImportClick = async () => {
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.import));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletImportStarted,
      properties: {
        account_type: 'imported',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

    navigate(
      getPlatform() === PLATFORM_FIREFOX
        ? ONBOARDING_IMPORT_WITH_SRP_ROUTE
        : ONBOARDING_METAMETRICS,
    );
  };

  const renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="240" height="240" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="240" height="240" />
      );
    }
    return (
      <Mascot animationEventEmitter={eventEmitter} width="250" height="300" />
    );
  };

  return (
    <div className="onboarding-welcome" data-testid="onboarding-welcome">
      <Carousel showThumbs={false} showStatus={false} showArrows>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
          >
            {t('welcomeToMetaMask')}
          </Text>
          <Text textAlign={TextAlign.Center} marginLeft={6} marginRight={6}>
            {t('welcomeToMetaMaskIntro')}
          </Text>
          <div className="onboarding-welcome__mascot">{renderMascot()}</div>
        </div>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
          >
            {t('welcomeExploreTitle')}
          </Text>
          <Text textAlign={TextAlign.Center}>
            {t('welcomeExploreDescription')}
          </Text>
          <div className="onboarding-welcome__image">
            <img
              src="/images/onboarding-welcome-say-hello.png"
              width="200"
              height="275"
              style={{
                objectFit: 'contain',
              }}
              alt="onboarding-welcome-say-hello"
            />
          </div>
        </div>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
          >
            {t('welcomeLoginTitle')}
          </Text>
          <Text textAlign={TextAlign.Center}>
            {t('welcomeLoginDescription')}
          </Text>
          <div className="onboarding-welcome__image">
            <img
              src="/images/onboarding-welcome-decentralised-apps.png"
              width="200"
              height="275"
              alt="onboarding-welcome-decentralised-apps"
              style={{
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      </Carousel>

      <ul className="onboarding-welcome__buttons">
        <li>
          <Box
            alignItems={AlignItems.center}
            className="onboarding__terms-of-use"
          >
            <CheckBox
              id="onboarding__terms-checkbox"
              className="onboarding__terms-checkbox"
              dataTestId="onboarding-terms-checkbox"
              checked={termsChecked}
              onClick={toggleTermsCheck}
            />
            <label
              className="onboarding__terms-label"
              htmlFor="onboarding__terms-checkbox"
            >
              <Text variant={TextVariant.bodyMd} marginLeft={2} as="span">
                {termsOfUse}
              </Text>
            </label>
          </Box>
        </li>

        <li>
          <Button
            data-testid="onboarding-create-wallet"
            type="primary"
            onClick={onCreateClick}
            disabled={!termsChecked}
          >
            {t('onboardingCreateWallet')}
          </Button>
        </li>
        <li>
          <Button
            data-testid="onboarding-import-wallet"
            type="secondary"
            onClick={onImportClick}
            disabled={!termsChecked}
          >
            {t('onboardingImportWallet')}
          </Button>
        </li>
      </ul>
    </div>
  );
}
