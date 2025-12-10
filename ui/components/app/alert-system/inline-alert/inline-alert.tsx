import classnames from 'classnames';
import React from 'react';
import {
  AlignItems,
  BorderRadius,
  Display,
  IconColor,
  Severity,
  TextColor,
  TextVariant,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';

export type InlineAlertProps = {
  /** The key of the alert */
  alertKey?: string;
  /** The onClick handler for the inline alerts */
  onClick?: () => void;
  /** The severity of the alert, e.g. Severity.Warning */
  severity?: Severity;
  /** Additional styles to apply to the inline alert */
  style?: React.CSSProperties;
  /** The text to override the default text */
  textOverride?: string;
  /** Whether to show the arrow icon */
  showArrow?: boolean;
  /** Whether to show the inline alert as a pill style */
  pill?: boolean;
  /** The name of the icon to show */
  iconName?: IconName;
  /** The color of the icon to show */
  iconColor?: IconColor;
  /** Whether to show the icon on the right side of the inline alert */
  iconRight?: boolean;
  /** The background color of the inline alert */
  backgroundColor?: BackgroundColor;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function InlineAlert({
  alertKey = '',
  onClick,
  severity = Severity.Info,
  style,
  textOverride,
  showArrow = true,
  pill = false,
  iconName,
  iconColor,
  iconRight,
  backgroundColor,
}: InlineAlertProps) {
  const renderIcon = () => (
    <Icon
      name={
        iconName ??
        (severity === Severity.Danger ? IconName.Danger : IconName.Info)
      }
      size={IconSize.Sm}
      color={iconColor}
    />
  );

  return (
    <Box display={Display.Flex}>
      <Box
        data-testid="inline-alert"
        {...(alertKey && { 'data-alert-key': alertKey })}
        borderRadius={BorderRadius.SM}
        gap={1}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        className={classnames({
          'inline-alert': true,
          'inline-alert__info': severity === Severity.Info,
          'inline-alert__warning': severity === Severity.Warning,
          'inline-alert__danger': severity === Severity.Danger,
          'inline-alert__success': severity === Severity.Success,
          'inline-alert__disabled': severity === Severity.Disabled,
          'inline-alert__pill': pill,
          'inline-alert__transparent-background': !textOverride,
        })}
        backgroundColor={backgroundColor}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        {!iconRight && renderIcon()}
        {textOverride && (
          <Text variant={TextVariant.bodySm} color={TextColor.inherit}>
            {textOverride}
          </Text>
        )}
        {iconRight && renderIcon()}
        {showArrow && <Icon name={IconName.ArrowRight} size={IconSize.Xs} />}
      </Box>
    </Box>
  );
}
