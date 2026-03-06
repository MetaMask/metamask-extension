import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconColor,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  AvatarIcon,
  AvatarIconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';
import type { ViewContactContentProps } from '../contacts.types';

function quadSplit(addr: string) {
  return `0x${
    addr
      .slice(2)
      .match(/.{1,4}/gu)
      ?.join('') ?? ''
  }`;
}

export function ViewContactContent({
  name,
  address,
  checkSummedAddress,
  memo,
  chainId,
  onEdit,
  onDelete,
}: ViewContactContentProps) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const networks = useSelector(getNetworkConfigurationsByChainId);
  const network = networks?.[chainId as Hex];
  const networkName = network?.name ?? t('networkTabCustom');
  const networkImage = getImageForChainId(chainId);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      padding={4}
      paddingTop={4}
      gap={6}
      className="flex flex-col min-h-0 w-full flex-1 justify-between"
    >
      {/* Centered avatar with network badge */}

      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={6}
        className="flex flex-col"
      >
        <Box>
          <BadgeWrapper
            badge={
              <AvatarIcon
                className="border-2 border-background-default rounded-md bg-primary-default"
                size={AvatarIconSize.Sm}
                iconName={IconName.Edit}
                iconProps={{ color: IconColor.PrimaryInverse }}
              />
            }
          >
            <AvatarAccount address={address} size={AvatarAccountSize.Xl} />
          </BadgeWrapper>
        </Box>
        {/* Fields: Nickname, Address, Network, Memo */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          className="flex w-full flex-col"
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex w-full flex-col"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              className="mb-1"
            >
              {t('nickname')}
            </Text>
            <Box
              padding={4}
              className="flex h-12 items-center rounded-xl border border-border-muted bg-background-muted"
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextDefault}
                ellipsis
                className="min-w-0 flex-1"
                data-testid="address-book-name"
              >
                {name || address}
              </Text>
            </Box>
          </Box>

          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex w-full flex-col"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              className="mb-1"
            >
              {t('publicAddress')}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              padding={4}
              className="flex h-12 items-center rounded-xl border border-border-muted bg-background-muted"
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextDefault}
                ellipsis
                className="min-w-0 flex-1 truncate"
                data-testid="address-book-view-contact-address"
              >
                {quadSplit(checkSummedAddress)}
              </Text>
              <ButtonIcon
                ariaLabel={t('copyToClipboard')}
                title={copied ? t('copiedExclamation') : t('copyToClipboard')}
                iconName={copied ? IconName.CopySuccess : IconName.Copy}
                size={ButtonIconSize.Sm}
                color={IconColor.IconAlternative}
                onClick={() => handleCopy(checkSummedAddress)}
              />
            </Box>
          </Box>

          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex w-full flex-col"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              className="mb-1"
            >
              {t('network')}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              padding={4}
              className="flex h-12 items-center rounded-xl border border-border-muted bg-background-muted"
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                name={networkName}
                src={networkImage}
              />
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextDefault}
                ellipsis
                className="min-w-0 flex-1"
              >
                {networkName}
              </Text>
            </Box>
          </Box>

          {memo?.length > 0 ? (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={1}
              className="flex w-full flex-col"
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                className="mb-1"
              >
                {t('memo')}
              </Text>
              <Box
                padding={4}
                className="flex min-h-12 items-center rounded-xl border border-border-muted bg-background-muted"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextDefault}
                >
                  {memo}
                </Text>
              </Box>
            </Box>
          ) : null}
        </Box>

        {/* Footer: Delete + Edit */}
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        marginTop={6}
        marginBottom={6}
        className="mt-6 mb-6 flex shrink-0 flex-row"
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isDanger
          onClick={onDelete}
          className="flex-1 rounded-xl"
          data-testid="view-contact-delete-button"
        >
          {t('delete')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={onEdit}
          className="flex-1 rounded-xl"
          data-testid="view-contact-edit-button"
        >
          {t('edit')}
        </Button>
      </Box>
    </Box>
  );
}
