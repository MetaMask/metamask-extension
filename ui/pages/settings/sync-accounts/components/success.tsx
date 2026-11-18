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
  walletCount?: number;
  importedAccountCount?: number;
};

const Success = ({
  onDone,
  walletCount = 2,
  importedAccountCount = 5,
}: SuccessProps) => {
  const t = useI18nContext();

  const description = t(
    importedAccountCount === 1
      ? 'qrSyncAccountImportedDescription'
      : 'qrSyncAccountsImportedDescription',
    [importedAccountCount],
  );

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
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
            className="max-w-80"
          >
            {description}
          </Text>
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
