import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTemplateAlertContext } from '../../../pages/confirmations/confirmation/alerts/TemplateAlertContext';
import { IconName } from '../../component-library';
import { PageContainerFooter } from '../../ui/page-container';

export const PermissionPageContainerFooter = ({
  cancelText,
  disabled,
  onCancel,
  onSubmit,
}: {
  cancelText: string;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) => {
  const t = useI18nContext();
  const { hasAlerts, showAlertsModal } = useTemplateAlertContext();

  return (
    <PageContainerFooter
      footerClassName="permission-page-container-footer"
      cancelButtonType="default"
      onCancel={onCancel}
      cancelText={cancelText}
      onSubmit={hasAlerts ? showAlertsModal : onSubmit}
      submitText={t('confirm')}
      disabled={disabled}
      submitButtonIcon={hasAlerts ? IconName.Info : undefined}
    />
  );
};
