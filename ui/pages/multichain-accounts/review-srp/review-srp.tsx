import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library/button-icon';
import {
  ButtonLinkSize,
  ButtonLink,
  IconName,
  Text,
  ButtonBase,
  ButtonBaseSize,
} from '../../../components/component-library';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import { Box } from '../../../components/component-library/box';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import RecoveryPhraseChips from '../../onboarding-flow/recovery-phrase/recovery-phrase-chips';
import { ACCOUNT_DETAILS_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  Footer,
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';

type ReviewSrpProps = {
  secretRecoveryPhrase: string;
};

export const ReviewSrp = ({ secretRecoveryPhrase }: ReviewSrpProps) => {
  const history = useHistory();
  const t = useI18nContext();
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);

  const handleOnShowSrpDetailsModal = useCallback(() => {
    // TODO: create a new event for this
    setShowSrpDetailsModal(true);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    handleCopy(secretRecoveryPhrase);
  }, [handleCopy, secretRecoveryPhrase]);

  return (
    <Page>
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.goBack()}
          />
        }
      >
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
            // TODO: create a new event for this
            setPhraseRevealed(true);
          }}
        />
        <ButtonBase
          backgroundColor={BackgroundColor.transparent}
          onClick={handleCopyToClipboard}
          paddingRight={0}
          paddingLeft={0}
          variant={TextVariant.bodyMdMedium}
          color={TextColor.primaryDefault}
          endIconName={copied ? IconName.CopySuccess : IconName.Copy}
          alignItems={AlignItems.center}
          data-testid="multichain-review-srp-copy-button"
          size={ButtonBaseSize.Md}
        >
          <Box display={Display.Flex}>{t('copyToClipboard')}</Box>
        </ButtonBase>
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
            history.push(ACCOUNT_DETAILS_CONFIRM_SRP_ROUTE);
          }}
        >
          {t('continue')}
        </Button>
      </Footer>
    </Page>
  );
};
