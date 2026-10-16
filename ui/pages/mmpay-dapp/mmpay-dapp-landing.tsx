import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18nContext } from '../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
// eslint-disable-next-line import-x/no-restricted-paths
import { ConfirmationLoader } from '../confirmations/hooks/useConfirmationNavigation';
import { Box, Text, ButtonPrimary } from '../../components/component-library';
import {
  TextVariant,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
} from '../../helpers/constants/design-system';
import PulseLoader from '../../components/ui/pulse-loader';

export function MmPayDappLanding() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const isInFlightRef = useRef(false);

  const type = searchParams.get('type');
  const amount = searchParams.get('amount') ?? undefined;

  useEffect(() => {
    if (isInFlightRef.current || !type) {
      return;
    }
    isInFlightRef.current = true;

    submitRequestToBackground<{ transactionId: string }>(
      'mmPayCreateTransaction',
      [{ type, amount }],
    )
      .then(({ transactionId }) => {
        navigate(
          {
            pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
            search: new URLSearchParams({
              loader: ConfirmationLoader.CustomAmount,
            }).toString(),
          },
          { replace: true },
        );
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      });
  }, [type, amount, navigate]);

  if (error) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        style={{ minHeight: '100vh', gap: '16px' }}
      >
        <Text variant={TextVariant.bodyMd}>{t('mmPayDappError', [error])}</Text>
        <ButtonPrimary onClick={() => navigate(DEFAULT_ROUTE)}>
          Back
        </ButtonPrimary>
      </Box>
    );
  }

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      style={{ minHeight: '100vh', gap: '16px' }}
    >
      <Text variant={TextVariant.bodyMd}>{t('mmPayDappLoading')}</Text>
      <PulseLoader />
    </Box>
  );
}
