import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Text,
  Container,
  ContainerMaxWidth,
  IconName,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  Display,
  TextAlign,
  TextVariant,
  FontWeight,
  FlexDirection,
  JustifyContent,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function RecoveryPhrase({ secretRecoveryPhrase }) {
  const history = useHistory();
  const t = useI18nContext();
  const { search } = useLocation();
  const [copied, handleCopy] = useCopyToClipboard();
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [hiddenPhrase, setHiddenPhrase] = useState(false);
  const searchParams = new URLSearchParams(search);
  const isFromReminderParam = searchParams.get('isFromReminder')
    ? '/?isFromReminder=true'
    : '';
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <div className="recovery-phrase" data-testid="recovery-phrase">
      <Container
        maxWidth={ContainerMaxWidth.Lg}
        marginLeft="auto"
        marginRight="auto"
      >
        <ThreeStepProgressBar stage={threeStepStages.RECOVERY_PHRASE_REVIEW} />
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          marginBottom={4}
          marginTop={4}
        >
          {t('seedPhraseWriteDownHeader')}
        </Text>
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Center}
          marginBottom={4}
        >
          {t('seedPhraseWriteDownDetails')}
        </Text>
        <Box
          className="recovery-phrase__tips"
          marginLeft="auto"
          marginRight="auto"
          marginBottom={4}
        >
          <Text
            variant={TextVariant.bodyLgMedium}
            fontWeight={FontWeight.Bold}
            marginBottom={2}
          >
            {t('tips')}:
          </Text>
          <Box
            as="ul"
            marginLeft={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={1}
          >
            <Text
              as="li"
              variant={TextVariant.bodyLgMedium}
              fontWeight={FontWeight.Normal}
            >
              {t('seedPhraseIntroSidebarBulletOne')}
            </Text>
            <Text
              as="li"
              variant={TextVariant.bodyLgMedium}
              fontWeight={FontWeight.Normal}
            >
              {t('seedPhraseIntroSidebarBulletThree')}
            </Text>
            <Text
              as="li"
              variant={TextVariant.bodyLgMedium}
              fontWeight={FontWeight.Normal}
            >
              {t('seedPhraseIntroSidebarBulletFour')}
            </Text>
          </Box>
        </Box>
      </Container>

      <Container
        maxWidth={ContainerMaxWidth.Lg}
        marginLeft="auto"
        marginRight="auto"
      >
        <RecoveryPhraseChips
          secretRecoveryPhrase={secretRecoveryPhrase.split(' ')}
          phraseRevealed={phraseRevealed && !hiddenPhrase}
          hiddenPhrase={hiddenPhrase}
        />
      </Container>
      <Container
        maxWidth={ContainerMaxWidth.Lg}
        marginLeft="auto"
        marginRight="auto"
        display={Display.Flex}
      >
        {phraseRevealed ? (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            gap={4}
            width={BlockSize.Full}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Button
                variant={ButtonVariant.Link}
                startIconName={hiddenPhrase ? IconName.Eye : IconName.EyeSlash}
                onClick={() => {
                  setHiddenPhrase(!hiddenPhrase);
                }}
              >
                {hiddenPhrase ? t('revealTheSeedPhrase') : t('hideSeedPhrase')}
              </Button>
              <Button
                variant={ButtonVariant.Link}
                onClick={() => {
                  handleCopy(secretRecoveryPhrase);
                }}
                startIconName={copied ? IconName.CopySuccess : IconName.Copy}
              >
                {copied ? t('copiedExclamation') : t('copyToClipboard')}
              </Button>
            </Box>
            <Button
              data-testid="recovery-phrase-next"
              size={ButtonSize.Lg}
              block
              onClick={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Onboarding,
                  event:
                    MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
                });
                history.push(
                  `${ONBOARDING_CONFIRM_SRP_ROUTE}${isFromReminderParam}`,
                );
              }}
            >
              {t('next')}
            </Button>
          </Box>
        ) : (
          <Button
            data-testid="recovery-phrase-reveal"
            size={ButtonSize.Lg}
            block
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Onboarding,
                event:
                  MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
              });
              setPhraseRevealed(true);
            }}
          >
            {t('revealSeedWords')}
          </Button>
        )}
      </Container>
    </div>
  );
}

RecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};
