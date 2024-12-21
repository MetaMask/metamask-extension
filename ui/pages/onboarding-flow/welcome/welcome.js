import EventEmitter from 'events';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { Carousel } from 'react-responsive-carousel';
///: END:ONLY_INCLUDE_IF
import Mascot from '../../../components/ui/mascot';
import {
  Text,
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Box,
  Checkbox,
  ButtonVariant,
} from '../../../components/component-library';
import {
  TextVariant,
  TextAlign,
  FontWeight,
  BlockSize,
  AlignItems,
  Display,
  Color,
  BorderStyle,
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
import { getFirstTimeFlowType, getCurrentKeyring } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { TermsOfUse } from '../../../components/app/terms-of-use-popup/terms-of-use';

const SCROLL_THRESHOLD = 50;
const SCROLL_TIMEOUT = 100;

export default function OnboardingWelcome() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const [eventEmitter] = useState(new EventEmitter());
  const currentKeyring = useSelector(getCurrentKeyring);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const modalBodyRef = useRef(null);

  useEffect(() => {
    if (!showTermsModal) {
      return undefined;
    }

    const modalBody = modalBodyRef.current;

    modalBody.scrollTop = 0;
    setTimeout(() => {
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }, SCROLL_TIMEOUT);

    const handleScroll = () => {
      if (modalBody) {
        const isAtBottom =
          modalBody.scrollHeight -
            modalBody.scrollTop -
            modalBody.clientHeight <
          SCROLL_THRESHOLD;
        setHasScrolledToBottom((prevValue) => prevValue || isAtBottom);
      }
    };

    if (modalBody) {
      modalBody.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (modalBody) {
        modalBody.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showTermsModal]);

  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (firstTimeFlowType === FirstTimeFlowType.import) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      }
      if (firstTimeFlowType === FirstTimeFlowType.restore) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    }
  }, [
    currentKeyring,
    history,
    firstTimeFlowType,
    newAccountCreationInProgress,
  ]);
  const trackEvent = useContext(MetaMetricsContext);

  const handleAcceptTerms = async () => {
    setShowTermsModal(false);
    if (pendingAction === 'create') {
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

      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      history.push(ONBOARDING_METAMETRICS);
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      await dispatch(setParticipateInMetaMetrics(false));
      history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
      ///: END:ONLY_INCLUDE_IF
    } else if (pendingAction === 'import') {
      await dispatch(setFirstTimeFlowType(FirstTimeFlowType.import));
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
    }
  };

  const onCreateClick = () => {
    setPendingAction('create');
    setShowTermsModal(true);
  };

  const onImportClick = () => {
    setPendingAction('import');
    setShowTermsModal(true);
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
          <Button
            data-testid="onboarding-create-wallet"
            variant={ButtonVariant.Primary}
            width={BlockSize.Full}
            onClick={onCreateClick}
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
            variant={ButtonVariant.Secondary}
            width={BlockSize.Full}
            onClick={onImportClick}
          >
            {t('onboardingImportWallet')}
          </Button>
        </li>
      </ul>

      {showTermsModal && (
        <Modal isOpen onClose={() => setShowTermsModal(false)}>
          <ModalOverlay />
          <ModalContent style={{ scrollTop: 0 }}>
            <ModalHeader>
              <Text
                variant={TextVariant.headingSm}
                textAlign={TextAlign.Center}
              >
                Review our latest terms of use
              </Text>
            </ModalHeader>
            <ModalBody
              ref={modalBodyRef}
              borderWidth={1}
              borderStyle={BorderStyle.Solid}
              borderColor={Color.borderDefault}
              padding={10}
              style={{
                maxHeight: '400px',
                borderRadius: '8px',
                marginLeft: '16px',
                marginRight: '16px',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
              }}
            >
              <TermsOfUse marginLeft={16} marginRight={16} showHeader />
            </ModalBody>
            <ModalFooter>
              <>
                <Box
                  alignItems={AlignItems.center}
                  display={Display.Flex}
                  gap={3}
                  marginBottom={4}
                  className="onboarding__terms-of-use"
                >
                  <Checkbox
                    id="onboarding__terms-checkbox"
                    className="onboarding__terms-checkbox"
                    data-testid="onboarding-terms-checkbox"
                    isDisabled={!hasScrolledToBottom}
                    isChecked={hasAgreedToTerms}
                    onClick={() =>
                      setHasAgreedToTerms((prevValue) => !prevValue)
                    }
                  />
                  <Text variant={TextVariant.bodyMd} marginLeft={2}>
                    I agree to the Terms of use, which apply to my use of
                    MetaMask and all of its features
                  </Text>
                </Box>
                <Button
                  onClick={handleAcceptTerms}
                  variant={ButtonVariant.Primary}
                  width={BlockSize.Full}
                  className="onboarding-welcome__terms-accept"
                  data-testid="onboarding-terms-accept"
                  disabled={!hasAgreedToTerms}
                >
                  {t('agree')}
                </Button>
              </>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
