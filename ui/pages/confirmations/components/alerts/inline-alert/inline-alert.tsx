import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { Icon, IconName, IconSize, Text } from '../../../../../components/component-library';
import { BackgroundColor, Severity, TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';


export interface InlineAlertProps {
  /** The value displayed */
  value: string;
  /** The label displayed */
  label: string;
  /** The severity of the alert, e.g. Severity.Warning */
  severity?: Severity;
}

function getSeverityBackground(severity: Severity): BackgroundColor {
  console.log(`severity: ${severity}`)
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
  value,
  label,
  severity = Severity.Info,
}: InlineAlertProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const t = useI18nContext();

  const handleClick = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  const severityBackground = getSeverityBackground(severity);
  console.log('severityBackground: ', severityBackground)

  return (
    <div>
      <div
        className={
          classnames(severityBackground,{
          'inline-alert': true,
          'inline-alert__informative': severity === Severity.Info,
          'inline-alert__non_critical': severity === Severity.Warning,
          'inline-alert__critical': severity === Severity.Danger,
        })
      }
        onClick={handleClick}
      >
          <Icon
            name={severity === Severity.Info ? IconName.Info : IconName.Danger}
            className="inline-alert__icon"
            size={IconSize.Sm}
          />
          <Text className="inline-alert__text" variant={TextVariant.bodySm} >
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
