import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ButtonLink,
  ButtonLinkSize,
  ModalBody,
} from '../../../../component-library';
import {
  setTutorialActiveStep,
  setTutorialModalOpen,
  PerpsTutorialStep,
} from '../../../../../ducks/perps';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import ProgressIndicator from '../ProgressIndicator';
import PerpsTutorialAnimation from '../PerpsTutorialAnimation';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 2;

const GoLongShortStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const handleNext = useCallback(() => {
    dispatch(setTutorialActiveStep(PerpsTutorialStep.ChooseLeverage));
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
  }, [dispatch]);

  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid="perps-tutorial-go-long-short"
    >
      <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

      <Box className="flex-1 flex flex-col items-center px-6 py-4">
        <Text variant={TextVariant.HeadingLg} className="text-center mb-2">
          {t('perpsTutorialGoLongShortTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-center text-alternative mb-4"
        >
          {t('perpsTutorialGoLongShortDescription')}
        </Text>
        <Box
          className="w-full flex-1"
          data-testid="perps-tutorial-step-image"
        >
          <PerpsTutorialAnimation artboardName="01_Short_Long" />
        </Box>
      </Box>

      <Box className="flex flex-col gap-2 px-4">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleNext}
          className="w-full"
          data-testid="perps-tutorial-continue-button"
        >
          {t('perpsTutorialContinue')}
        </Button>
        <ButtonLink
          size={ButtonLinkSize.Md}
          onClick={handleSkip}
          className="w-full justify-center"
          data-testid="perps-tutorial-skip-button"
        >
          {t('perpsTutorialSkip')}
        </ButtonLink>
      </Box>
    </ModalBody>
  );
};

export default GoLongShortStep;
