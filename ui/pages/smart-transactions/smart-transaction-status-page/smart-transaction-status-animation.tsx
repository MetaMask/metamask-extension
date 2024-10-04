import React, { useState, useCallback } from 'react';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { Box } from '../../../components/component-library';
import { Display } from '../../../helpers/constants/design-system';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';

const ANIMATIONS_FOLDER = 'images/animations/smart-transaction-status';

type AnimationInfo = {
  path: string;
  loop: boolean;
};

const Animations: Record<string, AnimationInfo> = {
  Failed: {
    path: `${ANIMATIONS_FOLDER}/failed.lottie.json`,
    loop: false,
  },
  Confirmed: {
    path: `${ANIMATIONS_FOLDER}/confirmed.lottie.json`,
    loop: false,
  },
  SubmittingIntro: {
    path: `${ANIMATIONS_FOLDER}/submitting-intro.lottie.json`,
    loop: false,
  },
  SubmittingLoop: {
    path: `${ANIMATIONS_FOLDER}/submitting-loop.lottie.json`,
    loop: true,
  },
  Processing: {
    path: `${ANIMATIONS_FOLDER}/processing.lottie.json`,
    loop: true,
  },
};

export const SmartTransactionStatusAnimation = ({
  status,
}: {
  status: SmartTransactionStatuses;
}) => {
  const [isIntro, setIsIntro] = useState(true);

  let animation: AnimationInfo;

  if (status === SmartTransactionStatuses.PENDING) {
    animation = isIntro
      ? Animations.SubmittingIntro
      : Animations.SubmittingLoop;
  } else {
    switch (status) {
      case SmartTransactionStatuses.SUCCESS:
        animation = Animations.Confirmed;
        break;
      case SmartTransactionStatuses.REVERTED:
      case SmartTransactionStatuses.UNKNOWN:
        animation = Animations.Failed;
        break;
      default:
        animation = Animations.Processing;
    }
  }

  const handleAnimationComplete = useCallback(() => {
    if (status === SmartTransactionStatuses.PENDING && isIntro) {
      setIsIntro(false);
    }
  }, [status, isIntro]);

  return (
    <Box display={Display.Flex} style={{ width: '48px', height: '48px' }}>
      <LottieAnimation
        path={animation.path}
        loop={animation.loop}
        autoplay={true}
        onComplete={handleAnimationComplete}
      />
    </Box>
  );
};
