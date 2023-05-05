import EventEmitter from 'events';
import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import { Text } from '../../../components/component-library';
import CheckBox from '../../../components/ui/check-box';
import Box from '../../../components/ui/box';
import {
  FONT_WEIGHT,
  TextAlign,
  TextVariant,
  AlignItems,
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
} from '../../../helpers/constants/routes';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import { getFirstTimeFlowType, getCurrentKeyring } from '../../../selectors';

export default function OnboardingWelcome() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const [eventEmitter] = useState(new EventEmitter());
  const currentKeyring = useSelector(getCurrentKeyring);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [termsChecked, setTermsChecked] = useState(false);

  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    if (currentKeyring) {
      if (firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    }
  }, [currentKeyring, history, firstTimeFlowType]);
  const trackEvent = useContext(MetaMetricsContext);

  const onCreateClick = () => {
    dispatch(setFirstTimeFlowType('create'));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletCreationStarted,
      properties: {
        account_type: 'metamask',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    history.push(ONBOARDING_METAMETRICS);
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

  const onImportClick = () => {
    dispatch(setFirstTimeFlowType('import'));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletImportStarted,
      properties: {
        account_type: 'imported',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    history.push(ONBOARDING_METAMETRICS);
  };

  trackEvent({
    category: MetaMetricsEventCategory.Onboarding,
    event: MetaMetricsEventName.OnboardingWelcome,
    properties: {
      message_title: t('welcomeToMetaMask'),
      app_version: global?.platform?.getVersion(),
    },
  });

  return (
    <div className="onboarding-welcome" data-testid="onboarding-welcome">
      <Carousel showThumbs={false} showStatus={false} showArrows>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('welcomeToMetaMask')}
          </Text>
          <Text textAlign={TextAlign.Center} marginLeft={6} marginRight={6}>
            {t('welcomeToMetaMaskIntro')}
          </Text>
          <div className="onboarding-welcome__mascot">
            <Mascot
              animationEventEmitter={eventEmitter}
              width="250"
              height="250"
            />
          </div>
        </div>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('welcomeExploreTitle')}
          </Text>
          <Text textAlign={TextAlign.Center}>
            {t('welcomeExploreDescription')}
          </Text>
          <div className="onboarding-welcome__image">
            <img
              src="/images/onboarding-welcome-say-hello.svg"
              width="169"
              height="237"
              alt=""
            />
          </div>
        </div>
        <div>
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            textAlign={TextAlign.Center}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('welcomeLoginTitle')}
          </Text>
          <Text textAlign={TextAlign.Center}>
            {t('welcomeLoginDescription')}
          </Text>
          <div className="onboarding-welcome__image">
            <img
              src="/images/onboarding-welcome-decentralised-apps.svg"
              width="327"
              height="256"
              alt=""
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
