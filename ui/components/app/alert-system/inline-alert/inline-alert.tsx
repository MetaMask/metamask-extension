import classnames from 'classnames';
import React from 'react';
import {
  AlignItems,
  BorderRadius,
  Display,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';

export type InlineAlertProps = {
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
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function InlineAlert({
  onClick,
  severity = Severity.Info,
  style,
  textOverride,
  showArrow = true,
}: InlineAlertProps) {
  const t = useI18nContext();

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
          'inline-alert__success': severity === Severity.Success,
        })}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        <Icon
          name={severity === Severity.Danger ? IconName.Danger : IconName.Info}
          size={IconSize.Sm}
        />
        <Text variant={TextVariant.bodySm} color={TextColor.inherit}>
          {textOverride ?? t('alert')}
        </Text>
        {showArrow && <Icon name={IconName.ArrowRight} size={IconSize.Xs} />}
      </Box>
    </Box>
  );
}
