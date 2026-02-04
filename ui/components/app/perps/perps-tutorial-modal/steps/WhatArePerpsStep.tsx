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

const TOTAL_STEPS = 6;
const CURRENT_STEP = 1;

const WhatArePerpsStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const handleNext = useCallback(() => {
    dispatch(setTutorialActiveStep(PerpsTutorialStep.GoLongOrShort));
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
  }, [dispatch]);

  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid="perps-tutorial-what-are-perps"
    >
      <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

      <Box className="flex-1 flex flex-col items-center justify-center px-6 pt-4 pb-2">
        <Box
          className="perps-tutorial-character__container mb-2"
          data-testid="perps-tutorial-step-image"
        >
          <img
            src="./images/perps-character.png"
            alt=""
            className="perps-tutorial-character__image"
          />
        </Box>

        <Text variant={TextVariant.HeadingLg} className="text-left mb-2 w-full">
          {t('perpsTutorialWhatArePerpsTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-left text-alternative w-full"
        >
          {t('perpsTutorialWhatArePerpsDescription')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-left text-alternative w-full mt-2"
        >
          {t('perpsTutorialWhatArePerpsSubtitle')}
        </Text>
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

export default WhatArePerpsStep;
