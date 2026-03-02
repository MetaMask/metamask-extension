import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type TutorialFooterProps = {
  onContinue: () => void;
  onSkip: () => void;
  isLastStep: boolean;
};

const TutorialFooter: React.FC<TutorialFooterProps> = ({
  onContinue,
  onSkip,
  isLastStep,
}) => {
  const t = useI18nContext();

  return (
    <Box className="flex flex-col gap-2 px-4">
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={onContinue}
        className="w-full"
        data-testid={
          isLastStep
            ? 'perps-tutorial-lets-go-button'
            : 'perps-tutorial-continue-button'
        }
      >
        {isLastStep ? t('perpsTutorialLetsGo') : t('perpsTutorialContinue')}
      </Button>
      {!isLastStep && (
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Sm}
          onClick={onSkip}
          className="w-full text-default"
          data-testid="perps-tutorial-skip-button"
        >
          {t('perpsTutorialSkip')}
        </Button>
      )}
    </Box>
  );
};

export default TutorialFooter;
