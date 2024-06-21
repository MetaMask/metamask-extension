import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  Box,
  Text,
  ButtonVariant,
  Button as NewButton,
  ButtonSize,
  IconName,
} from '../../../components/component-library';
// Using the old one since they have different properties and this one looks better
import Button from '../../../components/ui/button';

import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { ONBOARDING_PIN_EXTENSION_ROUTE } from '../../../helpers/constants/routes';
import RecoveryPhraseChips from '../../onboarding-flow/recovery-phrase/recovery-phrase-chips';

/**
 * Displays a SRP reminder to the user
 *
 * @param props
 * @param props.secretRecoveryPhrase
 * @returns
 */
export const RemindSRP: React.FC<{ secretRecoveryPhrase: string }> = ({
  secretRecoveryPhrase,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const [copied, handleCopy] = useCopyToClipboard() as [
    boolean,
    (value: string) => void,
  ];
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [hiddenPhrase, setHiddenPhrase] = useState(true);

  return (
    <Box>
      <Box
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text
          fontWeight={FontWeight.Bold}
          variant={TextVariant.headingLg}
          marginBottom={4}
        >
          {t('secretRecoveryPhrase')}
        </Text>

        <Text
          textAlign={TextAlign.Center}
          fontWeight={FontWeight.Normal}
          variant={TextVariant.headingSm}
        >
          {t('nonCustodialAccounts')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
      >
        <NewButton
          variant={ButtonVariant.Link}
          startIconName={hiddenPhrase ? IconName.Eye : IconName.EyeSlash}
          color={IconColor.primaryDefault}
          width={BlockSize.Full}
          size={ButtonSize.Sm}
          onClick={() => {
            setHiddenPhrase(!hiddenPhrase);
            setPhraseRevealed(true);
          }}
        >
          {hiddenPhrase ? t('revealTheSeedPhrase') : t('hideSeedPhrase')}
        </NewButton>

        <NewButton
          variant={ButtonVariant.Link}
          startIconName={copied ? IconName.CopySuccess : IconName.Copy}
          color={IconColor.primaryDefault}
          width={BlockSize.Full}
          size={ButtonSize.Sm}
          onClick={() => handleCopy(secretRecoveryPhrase)}
        >
          {copied ? t('copiedExclamation') : t('copyToClipboard')}
        </NewButton>
      </Box>

      <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
        <RecoveryPhraseChips
          secretRecoveryPhrase={secretRecoveryPhrase.split(' ')}
          phraseRevealed={phraseRevealed && !hiddenPhrase}
          hiddenPhrase={hiddenPhrase}
        />
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <Button
          data-testid="recovery-phrase-continue"
          className="recovery-phrase-continue"
          icon={null}
          type="primary"
          large
          onClick={() => {
            history.replace(ONBOARDING_PIN_EXTENSION_ROUTE);
          }}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};
