import React, { useEffect } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  TextAlign,
  BoxJustifyContent,
  BoxAlignItems,
  IconName,
  Icon,
  BoxFlexDirection,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import Spinner from '../../../../components/ui/spinner';
import PulseLoader from '../../../../components/ui/pulse-loader';

const DEFAULT_DELAY_MS = 2000;

type LoadingStepProps = {
  title: string;
  message: string;
  onComplete?: () => void;
  delayMs?: number;
};

const LoadingStep = ({
  title,
  message,
  onComplete,
  delayMs = DEFAULT_DELAY_MS,
}: LoadingStepProps) => {
  useEffect(() => {
    if (!onComplete) {
      return undefined;
    }

    const timer = setTimeout(onComplete, delayMs);
    return () => clearTimeout(timer);
  }, [onComplete, delayMs]);

  return (
    <Box className="p-4 flex flex-1 flex-col items-center justify-center gap-8 mt-10">
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        flexDirection={BoxFlexDirection.Row}
        gap={4}
      >
        <Box
          backgroundColor={BoxBackgroundColor.PrimaryMuted}
          padding={3}
          className="rounded-md"
        >
          <Icon name={IconName.Monitor} />
        </Box>
        <PulseLoader />
        <Box
          backgroundColor={BoxBackgroundColor.PrimaryMuted}
          padding={3}
          className="rounded-md"
        >
          <Icon name={IconName.Mobile} />
        </Box>
      </Box>
      <Box className="w-10 h-10">
        <Spinner />
      </Box>
      <Box className="flex flex-col items-center gap-1">
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          className='mb-2'
        >
          {title}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {message}
        </Text>
      </Box>
    </Box>
  );
};

export default LoadingStep;
