import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
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
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
} from '../../../selectors/selectors';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const MAX_NETWORK_AVATARS = 4;

export type MultichainAccountNetworkGroupWithCopyIconProps = {
  groupId: AccountGroupId;
};

/**
 * Displays network avatars with a copy icon. When the showDefaultAddress
 * preference is enabled, also displays the shortened default address.
 * Click copies the default address and shows "Copied" briefly.
 *
 * @param options0
 * @param options0.groupId
 */
export const MultichainAccountNetworkGroupWithCopyIcon = ({
  groupId,
}: MultichainAccountNetworkGroupWithCopyIconProps) => {
  const t = useI18nContext();
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddressPreference = useSelector(
    getShowDefaultAddressPreference,
  );
  const { defaultAddress, defaultScopes } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, groupId),
  );
  const shouldShowDefaultAddress =
    isDefaultAddressEnabled && showDefaultAddressPreference && defaultAddress;
  const [addressCopied, handleCopy] = useCopyToClipboard({
    clearDelayMs: null,
  });

  const handleDefaultAddressClick = useCallback(() => {
    if (defaultAddress) {
      handleCopy(normalizeSafeAddress(defaultAddress));
    }
  }, [defaultAddress, handleCopy]);

  return (
    <Box
      onClick={shouldShowDefaultAddress ? handleDefaultAddressClick : undefined}
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
        'rounded-lg inline-flex',
        shouldShowDefaultAddress && 'cursor-pointer',
      )}
      data-testid="network-group-with-copy-icon"
    >
      <MultichainAccountNetworkGroup
        groupId={groupId}
        chainIds={
          shouldShowDefaultAddress && defaultScopes.length > 0
            ? defaultScopes.slice(0, MAX_NETWORK_AVATARS)
            : undefined
        }
        limit={MAX_NETWORK_AVATARS}
      />
      {shouldShowDefaultAddress && (
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={
            addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
          }
          style={{ lineHeight: 0 }}
          data-testid="default-address-container"
        >
          {addressCopied
            ? t('addressCopied')
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
