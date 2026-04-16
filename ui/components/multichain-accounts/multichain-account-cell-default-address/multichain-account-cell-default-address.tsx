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
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MultichainTriggeredAddressRowsList } from '../multichain-address-rows-triggered-list/multichain-triggered-address-rows-list';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import { useDefaultAddress } from '../hooks/useDefaultAddress';

export type MultichainAccountCellDefaultAddressProps = {
  groupId: AccountGroupId;
};

/**
 * Displays a dropdown button and the default address with copy functionality.
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
            size: IconSize.Xs,
          }}
          ariaLabel={t('openMultichainAccountAddressMenu')}
          className="text-icon-alternative rounded-lg"
          data-testid="default-address-menu-button"
        />
      </MultichainTriggeredAddressRowsList>
      {displayDefaultAddress && defaultAddress ? (
        <Box
          onClick={handleDefaultAddressClick}
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
          className={classnames('rounded-lg h-6 min-w-0', {
            'hover:bg-muted-hover': !addressCopied,
          })}
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
          <Icon
            name={addressCopied ? IconName.CopySuccess : IconName.Copy}
            size={IconSize.Xs}
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
          {t('noDefaultAddress', [
            `${t(DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope])}`,
          ])}
        </Text>
      )}
    </Box>
  );
};
