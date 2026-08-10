import React from 'react';
import { type AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  ButtonIcon,
  ButtonIconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { MultichainTriggeredAddressRowsList } from '../multichain-address-rows-triggered-list/multichain-triggered-address-rows-list';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import { useDefaultAddress } from '../hooks/useDefaultAddress';

export type MultichainAccountCellDefaultAddressProps = {
  groupId: AccountGroupId;
};

/**
 * Displays the default address with copy-on-click and a dropdown button.
 * When a default address for an account is available, displays the shortened
 * default address. Click copies the default address and shows "Copied" briefly.
 *
 * @param options0
 * @param options0.groupId
 */
export const MultichainAccountCellDefaultAddress = ({
  groupId,
}: MultichainAccountCellDefaultAddressProps) => {
  const t = useI18nContext();
  const {
    defaultAddress,
    defaultAddressScope,
    displayDefaultAddress,
    addressCopied,
    handleDefaultAddressClick,
  } = useDefaultAddress(groupId);

  const handleAddressKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleDefaultAddressClick();
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className="min-w-0"
    >
      {displayDefaultAddress && defaultAddress ? (
        <Box
          onClick={handleDefaultAddressClick}
          onKeyDown={handleAddressKeyDown}
          tabIndex={0}
          role="button"
          aria-label={t('copyAddress')}
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          backgroundColor={
            addressCopied ? BoxBackgroundColor.SuccessMuted : undefined
          }
          paddingVertical={1}
          paddingHorizontal={2}
          className="rounded-lg h-6 min-w-0 hover:bg-muted-hover"
          data-testid="default-address-container"
        >
          <Text
            ellipsis
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Regular}
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
        </Box>
      ) : (
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {t('noDefaultAddress', [
            `${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])}`,
          ])}
        </Text>
      )}
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
          iconProps={{
            size: IconSize.Xs,
          }}
          ariaLabel={t('openMultichainAccountAddressMenu')}
          className="-ml-1 text-icon-alternative rounded-lg"
          data-testid="default-address-menu-button"
        />
      </MultichainTriggeredAddressRowsList>
    </Box>
  );
};
