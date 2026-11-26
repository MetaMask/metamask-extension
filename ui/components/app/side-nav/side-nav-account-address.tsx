import React from 'react';
import { type AccountGroupId } from '@metamask/account-api';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import { useDefaultAddress } from '../../multichain-accounts/hooks/useDefaultAddress';

export type SideNavAccountAddressProps = {
  groupId: AccountGroupId;
};

// Copyable default address for a side-nav account row
export const SideNavAccountAddress = ({
  groupId,
}: SideNavAccountAddressProps) => {
  const t = useI18nContext();
  const {
    defaultAddress,
    defaultAddressScope,
    addressCopied,
    handleDefaultAddressClick,
  } = useDefaultAddress(groupId);

  const scopeLabel = t(
    DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope],
  );

  if (!defaultAddress) {
    return (
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
        ellipsis
        data-testid="side-nav-account-cell-address"
      >
        {t('noDefaultAddress', [scopeLabel])}
      </Text>
    );
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleDefaultAddressClick();
  };

  return (
    <Box
      className="flex min-w-[60px] basis-[60px] grow max-w-max items-center gap-1"
      data-testid="side-nav-account-cell-address"
    >
      <Text
        ellipsis
        variant={TextVariant.BodySm}
        color={
          addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
        }
        className="min-w-0"
      >
        {addressCopied
          ? `${scopeLabel} ${t('addressCopied').toLowerCase()}`
          : shortenAddress(normalizeSafeAddress(defaultAddress))}
      </Text>
      <ButtonIcon
        onClick={handleClick}
        iconName={addressCopied ? IconName.CopySuccess : IconName.Copy}
        ariaLabel={t('copyAddress')}
        size={ButtonIconSize.Xs}
        className={`relative z-10 shrink-0 rounded-md ${
          addressCopied ? 'text-success-default' : 'text-icon-alternative'
        }`}
      />
    </Box>
  );
};
