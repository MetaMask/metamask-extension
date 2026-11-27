import React from 'react';
import classnames from 'clsx';
import { type AccountGroupId } from '@metamask/account-api';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import { useDefaultAddress } from '../hooks/useDefaultAddress';

export type MultichainAddressCopyButtonProps = {
  groupId: AccountGroupId;
};

/**
 * Button that displays and copies the default address for an account group.
 * Shows the shortened address or a success message after copying.
 */
export const MultichainAddressCopyButton = ({
  groupId,
}: MultichainAddressCopyButtonProps) => {
  const t = useI18nContext();
  const {
    defaultAddress,
    defaultAddressScope,
    displayDefaultAddress,
    addressCopied,
    handleDefaultAddressClick,
  } = useDefaultAddress(groupId);

  if (!displayDefaultAddress || !defaultAddress) {
    return null;
  }

  const visibleText = addressCopied
    ? `${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])} ${t('addressCopied').toLowerCase()}`
    : shortenAddress(normalizeSafeAddress(defaultAddress));

  const ariaLabel = addressCopied
    ? visibleText
    : `${visibleText}, ${t('copyAddress')}`;

  return (
    <>
      <button
        type="button"
        onClick={handleDefaultAddressClick}
        className={classnames(
          'flex h-6 flex-row items-center gap-1 rounded-lg border-0 p-1',
          {
            'cursor-pointer': true,
            'bg-success-muted': addressCopied,
            'bg-background-muted': !addressCopied,
            'hover:bg-muted-hover': !addressCopied,
          },
        )}
        data-testid="network-address-copy-button"
        aria-label={ariaLabel}
      >
        <Text
          ellipsis
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={
            addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
          }
          className="flex-1"
          data-testid="default-address-container"
        >
          {visibleText}
        </Text>
        <Icon
          name={addressCopied ? IconName.CopySuccess : IconName.Copy}
          size={IconSize.Sm}
          color={
            addressCopied ? IconColor.SuccessDefault : IconColor.IconAlternative
          }
        />
      </button>
      <span className="sr-only" role="status">
        {addressCopied ? t('addressCopied') : null}
      </span>
    </>
  );
};
