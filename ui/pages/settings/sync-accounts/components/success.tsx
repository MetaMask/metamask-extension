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
   * Number of wallets (SRPs) that were synced. Only exposed through the
   * `data-synced-wallet-count` attribute for tests.
   */
  walletCount?: number;
  /**
   * Number of imported private-key accounts that were synced. This is not the
   * number shown to the user. It is only exposed through the
   * `data-synced-account-count` attribute for tests.
   */
  importedAccountCount?: number;
  /**
   * Total number of accounts that were sent to MetaMask Mobile, across all
   * wallet types. This is the number shown in the description.
   */
  accountCount?: number;
};

const Success = ({
  onDone,
  walletCount = 0,
  importedAccountCount = 0,
  accountCount = 0,
}: SuccessProps) => {
  const t = useI18nContext();

  let description: string | null = null;
  if (accountCount > 0) {
    description = t(
      accountCount === 1
        ? 'qrSyncAccountImportedDescription'
        : 'qrSyncAccountsImportedDescription',
      [accountCount],
    );
  }

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      className="relative flex-1"
      data-testid="qr-sync-success"
      data-synced-wallet-count={walletCount}
      data-synced-account-count={importedAccountCount}
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
