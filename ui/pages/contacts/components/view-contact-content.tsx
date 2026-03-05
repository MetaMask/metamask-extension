import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconColor,
  Text,
  TextVariant,
  TextColor,
  AvatarAccount,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

function quadSplit(addr: string) {
  return `0x${addr.slice(2).match(/.{1,4}/gu)?.join('') ?? ''}`;
}

type ViewContactContentProps = {
  name: string;
  address: string;
  checkSummedAddress: string;
  memo: string;
  onEdit: () => void;
};

export function ViewContactContent({
  name,
  address,
  checkSummedAddress,
  memo,
  onEdit,
}: ViewContactContentProps) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  return (
    <Box padding={4}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        marginBottom={4}
        className="flex"
      >
        <AvatarAccount address={address} size={AvatarAccountSize.Lg} />
        <Text
          variant={TextVariant.BodyLg}
          ellipsis
          className="ms-4 min-w-0 overflow-hidden"
          data-testid="address-book-name"
        >
          {name || address}
        </Text>
      </Box>

      <Box marginBottom={4}>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onEdit}
          data-testid="view-contact-edit-button"
        >
          {t('edit')}
        </Button>
      </Box>

      <Box marginBottom={4}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mb-1"
        >
          {t('publicAddress')}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="flex"
        >
          <Text
            variant={TextVariant.BodyMd}
            ellipsis
            className="min-w-0 truncate"
            data-testid="address-book-view-contact-address"
          >
            {quadSplit(checkSummedAddress)}
          </Text>
          <ButtonIcon
            ariaLabel={t('copyToClipboard')}
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            iconName={copied ? IconName.CopySuccess : IconName.Copy}
            size={ButtonIconSize.Lg}
            color={IconColor.PrimaryDefault}
            onClick={() => handleCopy(checkSummedAddress)}
          />
        </Box>
      </Box>

      {memo?.length > 0 ? (
        <Box>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="mb-1"
          >
            {t('memo')}
          </Text>
          <Text variant={TextVariant.BodyMd}>{memo}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
