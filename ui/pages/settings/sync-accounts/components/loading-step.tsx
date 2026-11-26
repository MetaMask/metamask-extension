import React, { useEffect } from 'react';
import type { NamespacedName } from '@metamask/messenger';
import type { Json } from '@metamask/utils';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  TextAlign,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { subscribeToMessengerEvent } from '../../../../store/background-connection';
import LoadingFoxAnimation from './loading-fox-animation';

const DEFAULT_DELAY_MS = 2000;

type LoadingStepProps = {
  title: string;
  message: string;
  onComplete?: () => void;
  delayMs?: number;
  waitForMessengerEvent?: NamespacedName;
};

const LoadingStep = ({
  title,
  message,
  onComplete,
  delayMs = DEFAULT_DELAY_MS,
  waitForMessengerEvent,
}: LoadingStepProps) => {
  useEffect(() => {
    if (!onComplete) {
      return undefined;
    }

    if (!waitForMessengerEvent) {
      const timer = setTimeout(onComplete, delayMs);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    let unsubscribe: (() => Promise<void>) | undefined;

    const subscribe = async () => {
      unsubscribe = await subscribeToMessengerEvent<Json>(
        waitForMessengerEvent,
        () => {
          if (isMounted) {
            onComplete();
          }
        },
      ).catch(() => undefined);
    };

    subscribe();

    return () => {
      isMounted = false;
      unsubscribe?.().catch(() => undefined);
    };
  }, [delayMs, onComplete, waitForMessengerEvent]);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      className="flex-1"
      data-testid="qr-sync-loading"
      aria-busy="true"
    >
      <Box
        className="text-center flex-1 justify-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={0}
      >
        <LoadingFoxAnimation />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="min-h-[88px]"
        >
          <Text
            variant={TextVariant.HeadingMd}
            color={TextColor.TextDefault}
            fontWeight={FontWeight.Bold}
            textAlign={TextAlign.Center}
          >
            {title}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
            className="max-w-80"
          >
            {message}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingStep;
