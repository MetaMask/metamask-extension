import React, { useEffect } from 'react';
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
import classnames from 'clsx';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ShieldUnexpectedErrorEventLocationEnum } from '../../../../shared/constants/subscriptions';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import { reloadExtensionFromUi } from '../../../helpers/utils/reload-extension-from-ui';

type ApiErrorHandlerProps = {
  className?: string;
  error: Error;
  location: ShieldUnexpectedErrorEventLocationEnum;
  message?: string;
};

const ApiErrorHandler = ({
  className = '',
  error,
  location,
  message,
}: ApiErrorHandlerProps) => {
  const t = useI18nContext();
  const { captureShieldUnexpectedErrorEvent } = useSubscriptionMetrics();

  useEffect(() => {
    captureShieldUnexpectedErrorEvent({
      errorMessage: error?.message || 'Unknown error',
      location,
    });
    // eslint-disable-next-line react-compiler/react-compiler,react-hooks/exhaustive-deps -- we only want to capture the event once when the component is mounted
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
      <Text variant={TextVariant.BodyMd}>
        {message ?? t('shieldPlanErrorText')}
      </Text>
      <Button
        className="w-full"
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        // this reloads the entire extension
        onClick={async () => {
          await reloadExtensionFromUi();
        }}
      >
        {t('tryAgain')}
      </Button>
    </Box>
  );
};

export default ApiErrorHandler;
