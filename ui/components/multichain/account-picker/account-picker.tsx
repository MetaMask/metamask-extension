import React, { useCallback, useMemo } from 'react';
import classnames from 'clsx';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
  IconSize,
  type ButtonBaseProps,
  type TextProps,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { PreferredAvatar } from '../../app/preferred-avatar';

const AccountMenuStyle = { height: 'auto' };

export type AccountPickerProps = Omit<
  ButtonBaseProps<'button'>,
  'children' | 'name' | 'onClick'
> & {
  /**
   * Account name
   */
  name: string;
  /**
   * Account address, used for blockie or jazzicon
   */
  address: string;
  /**
   * Action to perform when the account picker is clicked
   */
  onClick: () => void;
  /**
   * Represents if the account address should display
   */
  showAddress?: boolean;
  /**
   * Props to be added to the address element
   */
  addressProps?: TextProps<'span'>;
  /**
   * Props to be added to the label element
   */
  labelProps?: TextProps<'span'>;
  /**
   * Props to be added to the text element
   */
  textProps?: ButtonBaseProps<'button'>['textProps'];
  /**
   * Additional className to be added to the AccountPicker
   */
  className?: string;
  /**
   * Represents if the avatar account should display
   */
  showAvatarAccount?: boolean;
};

export const AccountPicker = ({
  address,
  name,
  onClick,
  disabled = false,
  showAddress = false,
  addressProps = {},
  labelProps = {},
  textProps = {},
  className = '',
  showAvatarAccount = true,
  ...props
}: AccountPickerProps) => {
  const shortenedAddress = address
    ? shortenAddress(toChecksumHexAddress(address))
    : '';

  const handleClick = useCallback(() => {
    trace({ name: TraceName.AccountList });
    onClick();
  }, [onClick]);

  const accountNameStyling = useMemo(
    () => ({
      ...labelProps.style,
      fontWeight: 500,
    }),
    [labelProps.style],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      className="w-full"
    >
      <ButtonBase
        className={classnames('multichain-account-picker', className)}
        data-testid="account-menu-icon"
        onClick={handleClick}
        backgroundColor={BackgroundColor.transparent}
        borderRadius={BorderRadius.LG}
        ellipsis
        textProps={{
          display: Display.Flex,
          alignItems: AlignItems.center,
          gap: 2,
          ...textProps,
        }}
        size={showAddress ? ButtonBaseSize.Lg : ButtonBaseSize.Sm}
        disabled={disabled}
        endIconName={IconName.ArrowDown}
        endIconProps={{
          color: IconColor.iconDefault,
          size: IconSize.Sm,
        }}
        {...props}
        gap={1}
        style={AccountMenuStyle}
      >
        <Box
          display={Display.Flex}
          flexDirection={
            showAvatarAccount ? FlexDirection.Row : FlexDirection.Column
          }
          alignItems={AlignItems.center}
          gap={showAvatarAccount ? 2 : 0}
          className="min-w-0"
        >
          {showAvatarAccount ? (
            <PreferredAvatar
              address={address}
              size={showAddress ? AvatarAccountSize.Md : AvatarAccountSize.Xs}
            />
          ) : null}
          <Text
            as="span"
            ellipsis
            variant={TextVariant.bodyMdMedium}
            {...labelProps}
            className={classnames(
              'multichain-account-picker__label w-full',
              labelProps.className ?? '',
            )}
            style={accountNameStyling}
          >
            {name}
            {showAddress ? (
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySmMedium}
                ellipsis
                {...addressProps}
              >
                {shortenedAddress}
              </Text>
            ) : null}
          </Text>
        </Box>
      </ButtonBase>
    </Box>
  );
};
