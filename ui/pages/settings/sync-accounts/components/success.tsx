import React from 'react';
import {
  Box,
  Button,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SuccessCheckAnimation from './success-check-animation';

type SuccessProps = {
  onDone: () => void;
  /**
   * Number of HD/SRP wallets that were synced. Only exposed through the
   * `data-synced-wallet-count` attribute for tests.
   */
  syncedWalletCount?: number;
  /**
   * Number of imported private-key accounts that were synced. This is not the
   * number shown to the user. It is only exposed through the
   * `data-synced-account-count` attribute for tests.
   */
  syncedPrivateKeyAccountCount?: number;
  /**
   * Total number of selected accounts sent to MetaMask Mobile, across all
   * wallet types. This is the number shown in the description.
   */
  totalSelectedAccountCount?: number;
};

const Success = ({
  onDone,
  syncedWalletCount = 0,
  syncedPrivateKeyAccountCount = 0,
  totalSelectedAccountCount = 0,
}: SuccessProps) => {
  const t = useI18nContext();

  let description: string | null = null;
  if (totalSelectedAccountCount > 0) {
    description = t(
      totalSelectedAccountCount === 1
        ? 'qrSyncAccountImportedDescription'
        : 'qrSyncAccountsImportedDescription',
      [totalSelectedAccountCount],
    );
  }

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      className="relative flex-1"
      data-testid="qr-sync-success"
      data-synced-wallet-count={syncedWalletCount}
      data-synced-account-count={syncedPrivateKeyAccountCount}
    >
      <Box
        className="text-center flex-1 justify-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={0}
      >
        <SuccessCheckAnimation />
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
            {t('add_device_success_title')}
          </Text>
          {description ? (
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
              className="max-w-80"
            >
              {description}
            </Text>
          ) : null}
        </Box>
      </Box>
      <Button
        className="absolute bottom-4 left-0 w-full"
        onClick={onDone}
        data-testid="qr-sync-done-button"
      >
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
