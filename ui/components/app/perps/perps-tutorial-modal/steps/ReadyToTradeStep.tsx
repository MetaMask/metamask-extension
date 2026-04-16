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
import { ModalBody } from '../../../../component-library';
import { markTutorialCompleted } from '../../../../../ducks/perps';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import ProgressIndicator from '../ProgressIndicator';
import PerpsTutorialAnimation from '../PerpsTutorialAnimation';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 6;

const ReadyToTradeStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const handleComplete = useCallback(() => {
    dispatch(markTutorialCompleted());
  }, [dispatch]);

  return (
    <ModalBody
      className="w-full h-full pt-6 pb-4 flex flex-col"
      data-testid="perps-tutorial-ready-to-trade"
    >
      <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

      <Box className="flex-1 flex flex-col items-center px-6 pt-4 pb-2">
        <Text variant={TextVariant.HeadingLg} className="text-left mb-2 w-full">
          {t('perpsTutorialReadyToTradeTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-left text-alternative w-full"
        >
          {t('perpsTutorialReadyToTradeDescription')}
        </Text>
        <Box
          className="flex-1 flex items-center justify-center w-full"
          data-testid="perps-tutorial-step-image"
        >
          <PerpsTutorialAnimation artboardName="05_Ready" />
        </Box>
      </Box>

      <Box className="flex flex-col gap-2 px-4">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleComplete}
          className="w-full"
          data-testid="perps-tutorial-lets-go-button"
        >
          {t('perpsTutorialLetsGo')}
        </Button>
      </Box>
    </ModalBody>
  );
};

export default ReadyToTradeStep;
