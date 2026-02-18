import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
import { useCopyToClipboard } from 'ui/hooks/useCopyToClipboard';

const MAX_NETWORK_AVATARS = 4;

export type MultichainAccountNetworkGroupWithDefaultAddressProps = {
  /**
   * The account group ID to show the default address for.
   */
  groupId: AccountGroupId;
};

/**
 * Displays the default-address trigger: network avatars, shortened address,
 * and copy icon. Click copies the address and shows "Copied" briefly.
 *
 * @param options0
 * @param options0.groupId
 * @param options0.onCopy
 */
export const MultichainAccountNetworkGroupWithDefaultAddress = ({
  groupId,
}: MultichainAccountNetworkGroupWithDefaultAddressProps) => {
  const t = useI18nContext();
  const [defaultAddressCopied, setDefaultAddressCopied] = useState(false);
  const defaultAddressCopiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { defaultAddress, defaultScopes } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, groupId),
  );
  const [_, handleCopy] = useCopyToClipboard({
    clearDelayMs: null,
  });

  const handleDefaultAddressClick = useCallback(() => {
    if (!defaultAddress) {
      return;
    }
    if (defaultAddressCopiedTimeoutRef.current) {
      clearTimeout(defaultAddressCopiedTimeoutRef.current);
    }
    handleCopy(normalizeSafeAddress(defaultAddress));
    setDefaultAddressCopied(true);
    defaultAddressCopiedTimeoutRef.current = setTimeout(() => {
      setDefaultAddressCopied(false);
      defaultAddressCopiedTimeoutRef.current = null;
    }, 2000);
  }, [defaultAddress, handleCopy]);

  useEffect(() => {
    return () => {
      if (defaultAddressCopiedTimeoutRef.current) {
        clearTimeout(defaultAddressCopiedTimeoutRef.current);
      }
    };
  }, []);

  if (!defaultAddress) {
    return null;
  }

  return (
    <Box
      onClick={handleDefaultAddressClick}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      backgroundColor={
        defaultAddressCopied
          ? BoxBackgroundColor.SuccessMuted
          : BoxBackgroundColor.BackgroundMuted
      }
      padding={1}
      gap={1}
      className="cursor-pointer rounded-lg"
      data-testid="default-address-trigger"
    >
      <MultichainAccountNetworkGroup
        groupId={groupId}
        chainIds={defaultScopes.slice(0, MAX_NETWORK_AVATARS)}
        limit={MAX_NETWORK_AVATARS}
      />
      <Text
        variant={TextVariant.BodyXs}
        color={
          defaultAddressCopied
            ? TextColor.SuccessDefault
            : TextColor.TextAlternative
        }
        style={{ lineHeight: 0 }}
      >
        {defaultAddressCopied
          ? t('addressCopied')
          : shortenAddress(normalizeSafeAddress(defaultAddress))}
      </Text>
      <Icon
        name={defaultAddressCopied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Sm}
        color={
          defaultAddressCopied
            ? IconColor.SuccessDefault
            : IconColor.IconAlternative
        }
      />
    </Box>
  );
};
