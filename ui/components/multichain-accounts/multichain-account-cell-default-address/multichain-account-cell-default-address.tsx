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
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  getDefaultAddressScope,
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
} from '../../../selectors/selectors';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainTriggeredAddressRowsList } from '../multichain-address-rows-triggered-list/multichain-triggered-address-rows-list';
import {
  DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE,
  DefaultAddressScope,
} from '../../../../shared/constants/default-address';

export type MultichainAccountCellDefaultAddressProps = {
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
export const MultichainAccountCellDefaultAddress = ({
  groupId,
}: MultichainAccountCellDefaultAddressProps) => {
  const t = useI18nContext();
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddressPreference = useSelector(
    getShowDefaultAddressPreference,
  );
  const defaultAddressScope = useSelector(
    getDefaultAddressScope,
  ) as DefaultAddressScope;
  const { defaultAddress } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, groupId),
  );
  const displayDefaultAddress =
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
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      className="min-w-0"
    >
      <MultichainTriggeredAddressRowsList
        groupId={groupId}
        triggerMode="click"
        showAccountHeaderAndBalance={false}
        showViewAllButton={false}
        showDefaultAddressSection={false}
      >
        <ButtonIcon
          iconName={IconName.ArrowDown}
          size={ButtonIconSize.Sm}
          variant={ButtonIconVariant.Filled}
          iconProps={{
            size: IconSize.Sm,
          }}
          ariaLabel="Open multichain account address menu"
          className="text-icon-alternative rounded-lg"
          data-testid="default-address-menu-button"
        />
      </MultichainTriggeredAddressRowsList>
      {displayDefaultAddress ? (
        <Box
          onClick={
            displayDefaultAddress ? handleDefaultAddressClick : undefined
          }
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          backgroundColor={
            addressCopied
              ? BoxBackgroundColor.SuccessMuted
              : BoxBackgroundColor.BackgroundMuted
          }
          paddingVertical={1}
          paddingHorizontal={2}
          gap={1}
          className={classnames(
            'rounded-lg h-6 min-w-0',
            displayDefaultAddress && 'cursor-pointer',
          )}
          data-testid="default-address-container"
        >
          <Text
            ellipsis
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={
              addressCopied
                ? TextColor.SuccessDefault
                : TextColor.TextAlternative
            }
            className="flex-1"
          >
            {addressCopied
              ? `${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])} ${t('addressCopied').toLowerCase()}`
              : shortenAddress(normalizeSafeAddress(defaultAddress))}
          </Text>
          <Icon
            name={addressCopied ? IconName.CopySuccess : IconName.Copy}
            size={IconSize.Sm}
            color={
              addressCopied
                ? IconColor.SuccessDefault
                : IconColor.IconAlternative
            }
          />
        </Box>
      ) : (
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {t('noDefaultAddress', [`${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])}`] )}
        </Text>
      )}
    </Box>
  );
};
