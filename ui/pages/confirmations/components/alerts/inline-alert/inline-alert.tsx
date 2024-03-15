import React from 'react';
import classnames from 'classnames';
import {
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  BackgroundColor,
  Severity,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export interface InlineAlertProps {
  /** Handle click to open alert modal */
  onClick: () => void;
  /** The severity of the alert, e.g. Severity.Warning */
  severity?: Severity;
}

function getSeverityBackground(severity: Severity): BackgroundColor {
  switch (severity) {
    case Severity.Danger:
      return BackgroundColor.errorMuted;
    case Severity.Warning:
      return BackgroundColor.warningMuted;
    // Defaults to Severity.Info
    default:
      return BackgroundColor.primaryMuted;
  }
}

export default function InlineAlert({
  onClick,
  severity = Severity.Info,
}: InlineAlertProps) {
  const t = useI18nContext();

  const severityBackground = getSeverityBackground(severity);

  return (
    <div>
      <div
        data-testid="inlineAlert"
        className={classnames(severityBackground, {
          'inline-alert': true,
          'inline-alert__informative': severity === Severity.Info,
          'inline-alert__non_critical': severity === Severity.Warning,
          'inline-alert__critical': severity === Severity.Danger,
        })}
        onClick={onClick}
      >
        <Icon
          name={severity === Severity.Info ? IconName.Info : IconName.Danger}
          className="inline-alert__icon"
          size={IconSize.Sm}
        />
        <Text className="inline-alert__text" variant={TextVariant.bodySm}>
          {t('inlineAlert')}
        </Text>
        <Icon
          name={IconName.ArrowRight}
          className="inline-alert__icon"
          size={IconSize.Xs}
        />
      </div>
    </div>
  );
}
