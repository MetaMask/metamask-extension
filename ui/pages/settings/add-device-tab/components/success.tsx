import React from 'react';
import {
  Box,
  Button,
  Icon,
  IconColor,
  IconName,
  IconSize,
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

const getSuccessDescription = (
  t: ReturnType<typeof useI18nContext>,
  walletCount: number,
  importedAccountCount: number,
): string => {
  const hasWallets = walletCount > 0;
  const hasImported = importedAccountCount > 0;

  if (hasWallets && hasImported) {
    if (walletCount === 1 && importedAccountCount === 1) {
      return t('add_device_success_desc_wallet_singular_imported_singular');
    }
    if (walletCount === 1) {
      return t('add_device_success_desc_wallet_singular_imported_plural', [
        importedAccountCount,
      ]);
    }
    if (importedAccountCount === 1) {
      return t('add_device_success_desc_wallet_plural_imported_singular', [
        walletCount,
      ]);
    }
    return t('add_device_success_desc_wallet_plural_imported_plural', [
      walletCount,
      importedAccountCount,
    ]);
  }

  if (hasWallets) {
    return walletCount === 1
      ? t('add_device_success_desc_wallet_singular')
      : t('add_device_success_desc_wallet_plural', [walletCount]);
  }

  if (hasImported) {
    return importedAccountCount === 1
      ? t('add_device_success_desc_imported_singular')
      : t('add_device_success_desc_imported_plural', [importedAccountCount]);
  }

  return '';
};

const Success = ({
  onDone,
  walletCount = 2,
  importedAccountCount = 5,
}: SuccessProps) => {
  const t = useI18nContext();

  const description = getSuccessDescription(
    t,
    walletCount,
    importedAccountCount,
  );

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      gap={8}
      paddingTop={8}
      className="flex-1"
    >
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.SuccessDefault}
          className="mx-auto"
        />
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
        >
          {t('add_device_success_title')}
        </Text>
        {description && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {description}
          </Text>
        )}
      </Box>
      <Button className="w-full mt-10" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
