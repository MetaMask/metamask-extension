import React, { useState, useCallback } from 'react';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { Box } from '../../../components/component-library';
import { Display } from '../../../helpers/constants/design-system';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';

// eslint-disable-next-line import/no-restricted-paths
import failedAnimation from '../../../../app/images/animations/smart-transaction-status/failed.lottie.json';
// eslint-disable-next-line import/no-restricted-paths
import confirmedAnimation from '../../../../app/images/animations/smart-transaction-status/confirmed.lottie.json';
// eslint-disable-next-line import/no-restricted-paths
import submittingIntroAnimation from '../../../../app/images/animations/smart-transaction-status/submitting-intro.lottie.json';
// eslint-disable-next-line import/no-restricted-paths
import submittingLoopAnimation from '../../../../app/images/animations/smart-transaction-status/submitting-loop.lottie.json';
// eslint-disable-next-line import/no-restricted-paths
import processingAnimation from '../../../../app/images/animations/smart-transaction-status/processing.lottie.json';

const ANIMATIONS_FOLDER = 'images/animations/smart-transaction-status';

type AnimationInfo = {
  data: object;
  path: string;
  loop: boolean;
};

const Animations: Record<string, AnimationInfo> = {
  Failed: {
    data: failedAnimation,
    path: `${ANIMATIONS_FOLDER}/failed.lottie.json`,
    loop: false,
  },
  Confirmed: {
    data: confirmedAnimation,
    path: `${ANIMATIONS_FOLDER}/confirmed.lottie.json`,
    loop: false,
  },
  SubmittingIntro: {
    data: submittingIntroAnimation,
    path: `${ANIMATIONS_FOLDER}/submitting-intro.lottie.json`,
    loop: false,
  },
  SubmittingLoop: {
    data: submittingLoopAnimation,
    path: `${ANIMATIONS_FOLDER}/submitting-loop.lottie.json`,
    loop: true,
  },
  Processing: {
    data: processingAnimation,
    path: `${ANIMATIONS_FOLDER}/processing.lottie.json`,
    loop: true,
  },
};

export const SmartTransactionsStatusAnimation = ({
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
        data={animation.data}
        loop={animation.loop}
        autoplay={true}
        onComplete={handleAnimationComplete}
      />
    </Box>
  );
};
