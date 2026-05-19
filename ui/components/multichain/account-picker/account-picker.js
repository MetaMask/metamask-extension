import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  ButtonBaseSize,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { PreferredAvatar } from '../../app/preferred-avatar';

const AccountMenuStyle = { height: 'auto' };

const SPACING_CLASSES = {
  paddingLeft: {
    0: 'pl-0',
    1: 'pl-1',
    2: 'pl-2',
    3: 'pl-3',
    4: 'pl-4',
    5: 'pl-5',
    6: 'pl-6',
    7: 'pl-7',
    8: 'pl-8',
    9: 'pl-9',
    10: 'pl-10',
    11: 'pl-11',
    12: 'pl-12',
  },
  paddingRight: {
    0: 'pr-0',
    1: 'pr-1',
    2: 'pr-2',
    3: 'pr-3',
    4: 'pr-4',
    5: 'pr-5',
    6: 'pr-6',
    7: 'pr-7',
    8: 'pr-8',
    9: 'pr-9',
    10: 'pr-10',
    11: 'pr-11',
    12: 'pr-12',
  },
  paddingTop: {
    0: 'pt-0',
    1: 'pt-1',
    2: 'pt-2',
    3: 'pt-3',
    4: 'pt-4',
    5: 'pt-5',
    6: 'pt-6',
    7: 'pt-7',
    8: 'pt-8',
    9: 'pt-9',
    10: 'pt-10',
    11: 'pt-11',
    12: 'pt-12',
  },
  paddingBottom: {
    0: 'pb-0',
    1: 'pb-1',
    2: 'pb-2',
    3: 'pb-3',
    4: 'pb-4',
    5: 'pb-5',
    6: 'pb-6',
    7: 'pb-7',
    8: 'pb-8',
    9: 'pb-9',
    10: 'pb-10',
    11: 'pb-11',
    12: 'pb-12',
  },
};

const BORDER_RADIUS_CLASSES = {
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  none: 'rounded-none',
  pill: 'rounded-full',
  full: 'rounded-full',
};

const BORDER_COLOR_CLASSES = {
  'border-default': 'border border-default',
  'border-muted': 'border border-muted',
  transparent: 'border border-transparent',
};

const getSpacingClassName = (type, value) => SPACING_CLASSES[type]?.[value];

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
  block = false,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  borderRadius,
  borderColor,
  endIconProps = {},
  ...props
}) => {
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

  const { className: textPropsClassName, style: textPropsStyle } = textProps;
  const { className: addressPropsClassName } = addressProps;
  const { className: endIconPropsClassName, marginLeft, ...restEndIconProps } =
    endIconProps;
  const translatedEndIconProps = {
    color: IconColor.IconDefault,
    size: IconSize.Sm,
    ...restEndIconProps,
    ...(marginLeft === 'auto'
      ? {
          style: {
            ...restEndIconProps.style,
            marginLeft,
          },
        }
      : {}),
    ...(endIconPropsClassName ? { className: endIconPropsClassName } : {}),
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className="w-full"
    >
      <ButtonBase
        className={classnames(
          'multichain-account-picker bg-transparent rounded-lg min-w-0 gap-1',
          getSpacingClassName('paddingLeft', paddingLeft),
          getSpacingClassName('paddingRight', paddingRight),
          getSpacingClassName('paddingTop', paddingTop),
          getSpacingClassName('paddingBottom', paddingBottom),
          BORDER_RADIUS_CLASSES[borderRadius],
          BORDER_COLOR_CLASSES[borderColor],
          className,
        )}
        data-testid="account-menu-icon"
        onClick={() => {
          trace({ name: TraceName.AccountList });
          onClick();
        }}
        size={showAddress ? ButtonBaseSize.Lg : ButtonBaseSize.Sm}
        isDisabled={disabled}
        isFullWidth={block}
        endIconName={IconName.ArrowDown}
        endIconProps={translatedEndIconProps}
        {...props}
        style={AccountMenuStyle}
      >
        <Box
          flexDirection={
            showAvatarAccount ? BoxFlexDirection.Row : BoxFlexDirection.Column
          }
          alignItems={BoxAlignItems.Center}
          gap={showAvatarAccount ? 2 : 0}
          className={classnames('min-w-0', textPropsClassName)}
          style={textPropsStyle}
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
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  ellipsis
                  {...addressProps}
                  asChild
                  className={classnames('block', addressPropsClassName)}
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

AccountPicker.propTypes = {
  /**
   * Account name
   */
  name: PropTypes.string.isRequired,
  /**
   * Account address, used for blockie or jazzicon
   */
  address: PropTypes.string.isRequired,
  /**
   * Represents if the account address should display
   */
  showAddress: PropTypes.bool,
  /**
   * Props to be added to the address element
   */
  addressProps: PropTypes.object,
  /**
   * Action to perform when the account picker is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Represents if the AccountPicker should be actionable
   */
  disabled: PropTypes.bool,
  /**
   * Represents if the AccountPicker should take full width
   */
  block: PropTypes.bool,
  /**
   * Legacy padding props translated to DSR Tailwind classes
   */
  paddingLeft: PropTypes.number,
  paddingRight: PropTypes.number,
  paddingTop: PropTypes.number,
  paddingBottom: PropTypes.number,
  /**
   * Legacy border props translated to DSR Tailwind classes
   */
  borderRadius: PropTypes.string,
  borderColor: PropTypes.string,
  /**
   * Props to be added to the end icon
   */
  endIconProps: PropTypes.object,
  /**
   * Props to be added to the label element
   */
  labelProps: PropTypes.object,
  /**
   * Props to be added to the text element
   */
  textProps: PropTypes.object,
  /**
   * Additional className to be added to the AccountPicker
   */
  className: PropTypes.string,
  /**
   * Represents if the avatar account should display
   */
  showAvatarAccount: PropTypes.bool,
};
