import React from 'react';
import classnames from 'classnames';
import { Box, Icon, IconName, IconSize } from '../../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  Severity,
} from '../../../../helpers/constants/design-system';

export type InlineAlertProps = {
  /** The severity of the alert, e.g. Severity.Warning */
  severity?: Severity;
  /** Additional styles to apply to the inline alert */
  style?: React.CSSProperties;
  /** Whether the parent element is being hovered */
  isParentHovered?: boolean;
};

function getAlertHoverBackgroundColor(severity?: Severity): string {
  switch (severity) {
    case Severity.Danger:
      return 'var(--color-error-muted)';
    case Severity.Warning:
      return 'var(--color-warning-muted)';
    case Severity.Info:
      return 'var(--color-info-muted)';
    default:
      return '';
  }
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function InlineAlert({
  severity = Severity.Info,
  style,
  isParentHovered = false,
}: InlineAlertProps) {
  const hoverBackgroundColor = isParentHovered
    ? getAlertHoverBackgroundColor(severity)
    : '';

  const backgroundColorStyle = hoverBackgroundColor
    ? { backgroundColor: hoverBackgroundColor, opacity: 0.6 }
    : {};

  return (
    <Box display={Display.Flex}>
      <Box
        data-testid="inline-alert"
        borderRadius={BorderRadius.SM}
        gap={1}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        className={classnames({
          'inline-alert': true,
          'inline-alert__info': severity === Severity.Info,
          'inline-alert__warning': severity === Severity.Warning,
          'inline-alert__danger': severity === Severity.Danger,
        })}
        style={{
          transition: 'background-color 0.2s ease, opacity 0.2s ease',
          ...backgroundColorStyle,
          ...style,
        }}
      >
        <Icon
          name={severity === Severity.Info ? IconName.Info : IconName.Danger}
          size={IconSize.Sm}
        />
      </Box>
    </Box>
  );
}
