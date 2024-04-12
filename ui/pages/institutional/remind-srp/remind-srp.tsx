import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  Box,
  Text,
  ButtonVariant,
  Button,
  ButtonSize,
} from '../../../components/component-library';

import { ButtonIcon } from '../../../../ui/components/component-library/button-icon/button-icon';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  Size,
  TEXT_ALIGN,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Icon, IconName } from '../../../components/component-library';

import { MMI_ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import RecoveryPhraseChips from '../../../pages/onboarding-flow/recovery-phrase/recovery-phrase-chips';

/**
 * Displays a SRP reminder to the user
 *
 * @param props
 * @param props.secretRecoveryPhrase
 * @param props.propB
 * @param props.propC
 * @returns
 */
export const RemindSRP: React.FC<{
  secretRecoveryPhrase: string;
  propB: any[];
  propC?: string;
}> = ({ secretRecoveryPhrase, propB, propC }) => {
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
        <Text fontWeight={FontWeight.Bold} variant={TextVariant.headingLg}>
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
        <Button
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
        </Button>

        <Button
          variant={ButtonVariant.Link}
          startIconName={copied ? IconName.CopySuccess : IconName.Copy}
          color={IconColor.primaryDefault}
          width={BlockSize.Full}
          size={ButtonSize.Sm}
          onClick={() => handleCopy(secretRecoveryPhrase)}
        >
          {copied ? t('copiedExclamation') : t('copyToClipboard')}
        </Button>
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
          size={ButtonSize.Lg}
          data-testid="recovery-phrase-continue"
          type="primary"
          className="recovery-phrase__footer--button"
          onClick={() => {
            history.replace(MMI_ONBOARDING_COMPLETION_ROUTE);
          }}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};
