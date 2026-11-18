import React from 'react';
import { type AccountGroupId } from '@metamask/account-api';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
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

/**
 * Copyable default address for a side-nav account row.
 *
 * Unlike the shared account cell, this has no dropdown for the other addresses
 * in the group. The parent decides whether the preference is on; this only
 * renders the address, or the "no address" fallback when the group has none.
 *
 * @param props - Component props.
 * @param props.groupId - Account group whose scoped default address is shown.
 */
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
    <button
      type="button"
      className="flex min-w-0 items-center gap-1 bg-transparent p-0"
      onClick={handleClick}
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
      <Icon
        name={addressCopied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Xs}
        color={
          addressCopied ? IconColor.SuccessDefault : IconColor.IconAlternative
        }
        className="shrink-0"
      />
    </button>
  );
};
