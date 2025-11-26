import React, { useEffect } from 'react';
import browser from 'webextension-polyfill';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ShieldUnexpectedErrorEventLocationEnum } from '../../../../shared/constants/subscriptions';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';

type ApiErrorHandlerProps = {
  className?: string;
  error: Error;
  location: ShieldUnexpectedErrorEventLocationEnum;
};

const ApiErrorHandler = ({
  className = '',
  error,
  location,
}: ApiErrorHandlerProps) => {
  const t = useI18nContext();
  const { captureShieldUnexpectedErrorEvent } = useSubscriptionMetrics();

  useEffect(() => {
    captureShieldUnexpectedErrorEvent({
      errorMessage: error?.message || 'Unknown error',
      location,
    });
    // we only want to capture the event once when the component is mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      className={classnames(
        'flex flex-col items-center text-center gap-4 max-w-xs',
        className,
      )}
    >
      <Icon
        className="w-12 h-12"
        name={IconName.Error}
        color={IconColor.IconAlternative}
      />
      <Text variant={TextVariant.BodyMd}>{t('shieldPlanErrorText')}</Text>
      <Button
        className="w-full"
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        // this reloads the entire extension
        onClick={() => browser.runtime.reload()}
      >
        {t('tryAgain')}
      </Button>
    </Box>
  );
};

export default ApiErrorHandler;
