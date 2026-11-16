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
      gap={8}
      paddingTop={8}
      paddingBottom={4}
      className="flex-1"
      data-testid="qr-sync-success"
      data-synced-wallet-count={walletCount}
      data-synced-account-count={importedAccountCount}
    >
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={4}
      >
        <Box
          alignItems={BoxAlignItems.Center}
          className="relative h-[72px] w-[72px] rounded-full"
          data-testid="qr-sync-success-illustration"
          style={{
            backgroundImage:
              'linear-gradient(224.8765292996717deg, rgb(185, 243, 2) 24.273%, rgb(115, 166, 255) 91.804%), linear-gradient(144.01240046898857deg, rgb(115, 166, 255) 4.293%, rgb(185, 243, 2) 98.577%), linear-gradient(90deg, rgb(115, 166, 255) 0%, rgb(115, 166, 255) 100%)',
          }}
        >
          <img
            src="./images/qr-sync-success-check.svg"
            alt=""
            width={32}
            height={24}
            data-testid="qr-sync-success-check"
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(50% + 2px)',
              transform: 'translate(-50%, -50%)',
            }}
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
        className="w-full mt-auto"
        onClick={onDone}
        data-testid="qr-sync-done-button"
      >
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
