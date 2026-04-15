import React from 'react';
import classnames from 'clsx';
import { type AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import { useDefaultAddress } from '../hooks/useDefaultAddress';

const MAX_NETWORK_AVATARS = 4;

export type MultichainAccountNetworkGroupWithCopyIconProps = {
  groupId: AccountGroupId;
};

/**
 * Displays network avatars with a copy icon. When a default address
 * is available, also displays the shortened default address.
 * Click copies the default address and shows a message.
 *
 * @param options0
 * @param options0.groupId
 */
export const MultichainAccountNetworkGroupWithCopyIcon = ({
  groupId,
}: MultichainAccountNetworkGroupWithCopyIconProps) => {
  const t = useI18nContext();
  const {
    defaultAddress,
    defaultAddressScope,
    displayDefaultAddress,
    addressCopied,
    handleDefaultAddressClick,
  } = useDefaultAddress(groupId);

  return (
    <Box
      onClick={displayDefaultAddress ? handleDefaultAddressClick : undefined}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      backgroundColor={
        addressCopied
          ? BoxBackgroundColor.SuccessMuted
          : BoxBackgroundColor.BackgroundMuted
      }
      padding={1}
      gap={1}
      className={classnames(
        'rounded-lg h-6',
        displayDefaultAddress && 'cursor-pointer',
      )}
      data-testid="network-group-with-copy-icon"
    >
      <MultichainAccountNetworkGroup
        groupId={groupId}
        limit={MAX_NETWORK_AVATARS}
      />
      {displayDefaultAddress && defaultAddress && (
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
          {addressCopied
            ? `${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])} ${t('addressCopied').toLowerCase()}`
            : shortenAddress(normalizeSafeAddress(defaultAddress))}
        </Text>
      )}
      <Icon
        name={addressCopied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Sm}
        color={
          addressCopied ? IconColor.SuccessDefault : IconColor.IconAlternative
        }
      />
    </Box>
  );
};
