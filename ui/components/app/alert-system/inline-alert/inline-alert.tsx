import React from 'react';
import classnames from 'classnames';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getSeverityBackground } from '../utils';

export type InlineAlertProps = {
  /** The onClick handler for the inline alerts */
  onClick?: () => void;
  /** The severity of the alert, e.g. Severity.Warning */
  severity?: Severity;
  /** Additional styles to apply to the inline alert */
  style?: React.CSSProperties;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function InlineAlert({
  onClick,
  severity = Severity.Info,
  style,
}: InlineAlertProps) {
  const t = useI18nContext();

  return (
    <Box>
      <Box
        data-testid="inline-alert"
        backgroundColor={getSeverityBackground(severity)}
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
        style={style}
        onClick={onClick}
      >
        <Icon
          name={severity === Severity.Info ? IconName.Info : IconName.Danger}
          size={IconSize.Sm}
        />
        <Text variant={TextVariant.bodySm} color={TextColor.inherit}>
          {t('alert')}
        </Text>
        <Icon name={IconName.ArrowRight} size={IconSize.Xs} />
      </Box>
    </Box>
  );
}
