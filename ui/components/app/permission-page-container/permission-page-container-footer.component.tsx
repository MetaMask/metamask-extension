import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTemplateAlertContext } from '../../../pages/confirmations/confirmation/alerts/TemplateAlertContext';
import { Icon, IconName, IconSize } from '../../component-library';
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
      buttonSizeLarge={false}
      disabled={disabled}
      submitButtonIcon={
        hasAlerts ? <Icon name={IconName.Info} size={IconSize.Sm} /> : undefined
      }
    />
  );
};
