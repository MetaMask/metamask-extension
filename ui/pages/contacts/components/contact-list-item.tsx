import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { shortenAddress } from '../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';
import type { ContactListItemProps } from '../contacts.types';

export type { ContactListItemProps } from '../contacts.types';

export function ContactListItem({
  address,
  name,
  chainId,
  onSelect,
}: ContactListItemProps) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const network = allNetworks?.[chainId as Hex];
  const networkName = network?.name ?? t('networkTabCustom');
  const networkImage = getImageForChainId(chainId);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCopy(address);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      data-testid="contact-list-item"
      className="contact-list-item flex w-full cursor-pointer flex-row items-center gap-2 bg-transparent py-4 pl-0 pr-0"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
        className="min-w-0 flex-1"
      >
        <Box paddingTop={1}>
          <BadgeWrapper
            badge={
              <AvatarNetwork
                className="border-2 border-background-default rounded-md"
                size={AvatarNetworkSize.Xs}
                name={networkName}
                src={networkImage}
              />
            }
          >
            <AvatarAccount address={address} size={AvatarAccountSize.Md} />
          </BadgeWrapper>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          gap={1}
          className="min-w-0 flex-1 overflow-hidden"
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            textAlign={TextAlign.Left}
            ellipsis
            data-testid="contact-list-item-label"
          >
            {name}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Left}
            ellipsis
            data-testid="contact-list-item-address"
          >
            {shortenAddress(address)}
          </Text>
        </Box>
      </Box>
      <ButtonIcon
        ariaLabel={t('copyToClipboard')}
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
        iconName={copied ? IconName.CopySuccess : IconName.Copy}
        size={ButtonIconSize.Md}
        iconProps={{
          className: copied
            ? IconColor.SuccessDefault
            : IconColor.IconAlternative,
        }}
        onClick={onCopy}
        data-testid="contact-list-item-copy"
        className="mt-4"
      />
    </Box>
  );
}
