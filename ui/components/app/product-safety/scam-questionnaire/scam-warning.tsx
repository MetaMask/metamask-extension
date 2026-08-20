import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PROCEED_DELAY_SECONDS } from './scam-questionnaire.constants';

export type ScamWarningProps = {
  onStop: () => void;
  onContactSupport: () => void;
  onProceed: () => void;
};

export const ScamWarning: React.FC<ScamWarningProps> = ({
  onStop,
  onContactSupport,
  onProceed,
}) => {
  const t = useI18nContext();

  // Gate the bypass link for a few seconds so the warning can't be dismissed
  // instantly.
  const [secondsRemaining, setSecondsRemaining] = useState(
    PROCEED_DELAY_SECONDS,
  );
  const canProceed = secondsRemaining === 0;

  useEffect(() => {
    if (secondsRemaining === 0) {
      return undefined;
    }
    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [secondsRemaining]);

  const handleContactSupport = useCallback(() => {
    onContactSupport();
    if (SUPPORT_LINK) {
      global.platform?.openTab({ url: SUPPORT_LINK });
    }
  }, [onContactSupport]);

  return (
    <Box className="flex h-full flex-col">
      <Box className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4">
        <Box className="mb-2 flex justify-center">
          <Box className="bg-error-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Icon
              name={IconName.Danger}
              size={IconSize.Lg}
              color={IconColor.ErrorDefault}
            />
          </Box>
        </Box>
        <Text variant={TextVariant.HeadingLg} className="text-center">
          {t('scamQuestionnaireWarningTitle')}
        </Text>
        <Box className="flex flex-row gap-2">
          <Icon
            name={IconName.Flag}
            size={IconSize.Sm}
            color={IconColor.ErrorDefault}
            className="mt-1 shrink-0"
          />
          <Text variant={TextVariant.BodyMd}>
            {t('scamQuestionnaireWarningReasonKnownScam')}
          </Text>
        </Box>
        <Box className="flex flex-row gap-2">
          <Icon
            name={IconName.Refresh}
            size={IconSize.Sm}
            color={IconColor.ErrorDefault}
            className="mt-1 shrink-0"
          />
          <Text variant={TextVariant.BodyMd}>
            <b className="font-bold">
              {t('scamQuestionnaireWarningReasonIrreversibleEmphasis')}
            </b>{' '}
            {t('scamQuestionnaireWarningReasonIrreversibleDetail')}
          </Text>
        </Box>
      </Box>
      <Box className="flex flex-col items-center gap-3 p-4">
        <TextButton
          onClick={canProceed ? onProceed : undefined}
          isDisabled={!canProceed}
          data-testid="scam-warning-proceed"
          className={canProceed ? '' : 'text-alternative'}
        >
          {canProceed
            ? t('scamQuestionnaireWarningProceedAnyway')
            : t('scamQuestionnaireWarningProceedAnywayCountdown', [
                secondsRemaining,
              ])}
        </TextButton>
        <Button
          size={ButtonSize.Lg}
          isFullWidth
          isDanger
          onClick={onStop}
          data-testid="scam-warning-stop"
        >
          {t('scamQuestionnaireWarningStopPayment')}
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={handleContactSupport}
          data-testid="scam-warning-contact-support"
        >
          {t('scamQuestionnaireWarningContactSupport')}
        </Button>
      </Box>
    </Box>
  );
};
