import React, { useCallback, useContext, useState } from 'react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { useHistory } from 'react-router-dom';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  BackgroundColor,
  BlockSize,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSelector } from 'react-redux';
import { getHDEntropyIndex } from '../../../selectors';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library/button-icon';
import {
  ButtonLinkSize,
  ButtonLink,
  IconName,
  Text,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import { Box } from '../../../components/component-library/box';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import RecoveryPhraseChips from '../../onboarding-flow/recovery-phrase/recovery-phrase-chips';
import { ONBOARDING_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import { Footer, Content, Header, Page } from '../../../components/multichain/pages/page';

type ReviewSrpProps = {
  secretRecoveryPhrase: string;
};

export const ReviewSrp = ({ secretRecoveryPhrase }: ReviewSrpProps) => {
  const history = useHistory();
  const t = useI18nContext();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);
  const isFromReminderParam = true;
  const trackEvent = useContext(MetaMetricsContext);

  const handleOnShowSrpDetailsModal = useCallback(() => {
    // TODO: create a new event for this
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SrpDefinitionClicked,
      properties: {
        location: 'review_recovery_phrase',
      },
    });
    setShowSrpDetailsModal(true);
  }, [trackEvent]);

  return (
    <Page>
      <Header backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.goBack()}
          />
        }>
        {t('saveSrp')}
      </Header>
      <Content>
        {showSrpDetailsModal && (
          <SRPDetailsModal onClose={() => setShowSrpDetailsModal(false)} />
        )}
        <Box marginBottom={6}>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {t('seedPhraseReviewDetails', [
              <ButtonLink
                key="seedPhraseReviewDetails"
                size={ButtonLinkSize.Inherit}
                onClick={handleOnShowSrpDetailsModal}
              >
                {t('secretRecoveryPhrase')}
              </ButtonLink>,
              <Text
                key="seedPhraseReviewDetails2"
                fontWeight={FontWeight.Medium}
                color={TextColor.textAlternative}
              >
                {t('seedPhraseReviewDetails2')}
              </Text>,
            ])}
          </Text>
        </Box>
        <RecoveryPhraseChips
          secretRecoveryPhrase={secretRecoveryPhrase.split(' ')}
          phraseRevealed={phraseRevealed}
          revealPhrase={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event:
                MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
              properties: {
                hd_entropy_index: hdEntropyIndex,
              },
            });
            setPhraseRevealed(true);
          }}
        />
      </Content>
      <Footer>
        <Button
          width={BlockSize.Full}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          data-testid="multichain-review-srp-continue"
          className="multichain-review-srp__footer--button"
          disabled={!phraseRevealed}
          onClick={() => {
            // TODO: create a new event for this
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event:
                MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
              properties: {
                hd_entropy_index: hdEntropyIndex,
              },
            });
            history.push(
              `${ONBOARDING_CONFIRM_SRP_ROUTE}${isFromReminderParam}`,
            );
          }}
        >
          {t('continue')}
        </Button>
      </Footer>
    </Page>
  );
};
