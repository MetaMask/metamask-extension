import EventEmitter from 'events';
import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { Carousel } from 'react-responsive-carousel';
///: END:ONLY_INCLUDE_IF
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  setParticipateInMetaMetrics,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  ONBOARDING_METAMETRICS,
  ///: END:ONLY_INCLUDE_IF
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
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

  const onCreateClick = async () => {
    dispatch(setFirstTimeFlowType('create'));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletCreationStarted,
      properties: {
        account_type: 'metamask',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    history.push(ONBOARDING_METAMETRICS);
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    await dispatch(setParticipateInMetaMetrics(false));
    history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
    ///: END:ONLY_INCLUDE_IF
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
    dispatch(setFirstTimeFlowType('import'));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletImportStarted,
      properties: {
        account_type: 'imported',
      },
    });
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    history.push(ONBOARDING_METAMETRICS);
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    await dispatch(setParticipateInMetaMetrics(false));
    history.push(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
    ///: END:ONLY_INCLUDE_IF
  };

  return (
    <div className="onboarding-welcome" data-testid="onboarding-welcome">
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
              fontWeight={FontWeight.Bold}
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
              fontWeight={FontWeight.Bold}
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
        ///: END:ONLY_INCLUDE_IF
      }

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        <div>
          <Text
            variant={TextVariant.headingLg}
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
          >
            {t('installExtension')}
          </Text>
          <Text
            textAlign={TextAlign.Center}
            marginTop={2}
            marginLeft={6}
            marginRight={6}
          >
            {t('installExtensionDescription')}
          </Text>
          <div className="onboarding-welcome__mascot">
            <Mascot
              animationEventEmitter={eventEmitter}
              width="250"
              height="250"
            />
          </div>
        </div>
        ///: END:ONLY_INCLUDE_IF
      }

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
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
              t('onboardingCreateWallet')
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              t('continue')
              ///: END:ONLY_INCLUDE_IF
            }
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
