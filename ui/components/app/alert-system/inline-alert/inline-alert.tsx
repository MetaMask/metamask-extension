import classnames from 'clsx';
import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import {
  IconColor,
  Severity,
  TextColor,
  TextVariant,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { Icon, IconName, IconSize, Text } from '../../../component-library';

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
    <Box className="flex">
      <Box
        data-testid="inline-alert"
        {...(alertKey && { 'data-alert-key': alertKey })}
        gap={1}
        className={classnames({
          'inline-flex rounded-sm': true,
          'inline-alert': true,
          'inline-alert__info': severity === Severity.Info,
          'inline-alert__warning': severity === Severity.Warning,
          'inline-alert__danger': severity === Severity.Danger,
          'inline-alert__success': severity === Severity.Success,
          'inline-alert__disabled': severity === Severity.Disabled,
          'inline-alert__pill': pill,
          'inline-alert__transparent-background': !textOverride,
        })}
        alignItems={BoxAlignItems.Center}
        backgroundColor={backgroundColor as unknown as BoxBackgroundColor}
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
