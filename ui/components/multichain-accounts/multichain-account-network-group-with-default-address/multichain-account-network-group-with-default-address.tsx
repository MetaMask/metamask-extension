import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
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
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const MAX_NETWORK_AVATARS = 4;

export type MultichainAccountNetworkGroupWithDefaultAddressProps = {
  groupId: AccountGroupId;
};

/**
 * Displays the default-address component: includes network avatars, shortened address,
 * and copy icon. Click copies the address and shows "Copied" briefly.
 *
 * @param options0
 * @param options0.groupId
 */
export const MultichainAccountNetworkGroupWithDefaultAddress = ({
  groupId,
}: MultichainAccountNetworkGroupWithDefaultAddressProps) => {
  const t = useI18nContext();
  const { defaultAddress, defaultScopes } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, groupId),
  );
  const [addressCopied, handleCopy] = useCopyToClipboard({
    clearDelayMs: null,
  });

  const handleDefaultAddressClick = useCallback(() => {
    if (!defaultAddress) {
      return;
    }
    handleCopy(normalizeSafeAddress(defaultAddress));
  }, [defaultAddress, handleCopy]);

  if (!defaultAddress) {
    return null;
  }

  return (
    <Box
      onClick={handleDefaultAddressClick}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      backgroundColor={
        addressCopied
          ? BoxBackgroundColor.SuccessMuted
          : BoxBackgroundColor.BackgroundMuted
      }
      padding={1}
      gap={1}
      className="cursor-pointer rounded-lg"
      data-testid="default-address-container"
    >
      <MultichainAccountNetworkGroup
        groupId={groupId}
        chainIds={defaultScopes.slice(0, MAX_NETWORK_AVATARS)}
        limit={MAX_NETWORK_AVATARS}
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={
          addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
        }
        style={{ lineHeight: 0 }}
      >
        {addressCopied
          ? t('addressCopied')
          : shortenAddress(normalizeSafeAddress(defaultAddress))}
      </Text>
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
