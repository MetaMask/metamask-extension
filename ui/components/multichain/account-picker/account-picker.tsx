import React, { useMemo } from 'react';
import classnames from 'clsx';
import {
  AvatarAccountSize,
  Box,
  ButtonBase,
  ButtonBaseSize,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  type IconProps,
  type TextProps,
} from '@metamask/design-system-react';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import {
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { PreferredAvatar } from '../../app/preferred-avatar';

const AccountMenuStyle = { height: 'auto' };

const TEXT_PROPS_GAP_CLASS: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
};

type AccountPickerLayoutProps = {
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  borderRadius?: BorderRadius;
  borderColor?: BorderColor;
  endIconProps?: Partial<IconProps>;
};

export type AccountPickerProps = {
  address: string;
  name: string;
  onClick: () => void;
  disabled?: boolean;
  showAddress?: boolean;
  addressProps?: Partial<TextProps>;
  labelProps?: Partial<TextProps>;
  textProps?: { gap?: number; className?: string };
  className?: string;
  showAvatarAccount?: boolean;
  block?: boolean;
} & AccountPickerLayoutProps &
  Omit<
    React.ComponentPropsWithoutRef<'button'>,
    | 'onClick'
    | 'children'
    | keyof AccountPickerLayoutProps
    | 'className'
    | 'disabled'
  >;

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
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  borderRadius,
  borderColor,
  endIconProps: endIconPropsFromProps,
  ...buttonProps
}: AccountPickerProps) => {
  const shortenedAddress = address
    ? shortenAddress(toChecksumHexAddress(address))
    : '';

  const accountNameStyling = useMemo(
    () => ({
      ...labelProps.style,
      fontWeight: 500,
    }),
    [labelProps.style],
  );

  const paddingClassName = classnames(
    paddingLeft === 2 && 'pl-2',
    paddingRight === 2 && 'pr-2',
    paddingTop === 3 && 'pt-3',
    paddingBottom === 3 && 'pb-3',
  );

  const innerGapClass =
    typeof textProps.gap === 'number'
      ? (TEXT_PROPS_GAP_CLASS[textProps.gap] ?? 'gap-2')
      : 'gap-2';

  const mergedEndIconProps: Partial<IconProps> = {
    color: IconColor.IconDefault,
    size: IconSize.Sm,
    ...endIconPropsFromProps,
  };

  return (
    <Box className="flex w-full flex-row items-center">
      <ButtonBase
        className={classnames(
          'multichain-account-picker',
          'h-auto min-h-0 justify-start gap-1 rounded-lg border-0 bg-transparent px-4 py-0 text-left shadow-none',
          'hover:bg-background-default-hover focus:bg-background-default-hover',
          paddingClassName,
          borderColor === BorderColor.borderDefault && 'border border-default',
          borderRadius === BorderRadius.MD && 'rounded-md',
          className,
        )}
        data-testid="account-menu-icon"
        onClick={() => {
          trace({ name: TraceName.AccountList });
          onClick();
        }}
        size={showAddress ? ButtonBaseSize.Lg : ButtonBaseSize.Sm}
        isDisabled={disabled}
        endIconName={IconName.ArrowDown}
        endIconProps={mergedEndIconProps}
        style={AccountMenuStyle}
        {...buttonProps}
      >
        <Box
          className={classnames(
            'flex min-w-0 items-center',
            innerGapClass,
            showAvatarAccount ? 'flex-row' : 'flex-col gap-0',
            textProps.className,
          )}
        >
          {showAvatarAccount ? (
            <PreferredAvatar
              address={address}
              size={showAddress ? AvatarAccountSize.Md : AvatarAccountSize.Xs}
            />
          ) : null}
          <Text
            asChild
            ellipsis
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            {...labelProps}
            className={classnames(
              'multichain-account-picker__label w-full',
              labelProps.className ?? '',
            )}
            style={accountNameStyling}
          >
            <span>
              {name}
              {showAddress ? (
                <Text
                  asChild
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  ellipsis
                  {...addressProps}
                >
                  <span>{shortenedAddress}</span>
                </Text>
              ) : null}
            </span>
          </Text>
        </Box>
      </ButtonBase>
    </Box>
  );
};
