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
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../../shared/constants/app';
import ProgressIndicator from '../ProgressIndicator';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 1;

const WhatArePerpsStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const handleNext = useCallback(() => {
    dispatch(setTutorialActiveStep(PerpsTutorialStep.GoLongOrShort));
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
  }, [dispatch]);

  return (
    <ModalBody
      className="w-full h-full pt-6 pb-4 flex flex-col"
      data-testid="perps-tutorial-what-are-perps"
    >
      <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

      <Box className="flex-1 flex flex-col items-center px-6 pt-4">
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

        <Box
          data-testid="perps-tutorial-step-image"
          style={{
            height: isPopup ? 180 : 280,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src="./images/perps-character.png"
            alt=""
            style={{
              width: isPopup ? 180 : 280,
              height: isPopup ? 180 : 280,
              objectFit: 'contain',
            }}
          />
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

export default WhatArePerpsStep;
