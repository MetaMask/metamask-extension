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
  BoxJustifyContent,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { subscribeToMessengerEvent } from '../../../../store/background-connection';

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
      gap={8}
      paddingTop={8}
      className="flex-1"
      data-testid="qr-sync-loading"
    >
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={10}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="h-[72px] w-[72px]"
          data-testid="qr-sync-loading-indicator"
        >
          <Icon
            name={IconName.Loading}
            size={IconSize.Lg}
            className="animate-spin"
            aria-hidden
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
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
