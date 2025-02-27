import { ApprovalRequest } from '@metamask/approval-controller';
import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

import useAlerts from '../../../../hooks/useAlerts';
import { AlertActionHandlerProvider } from '../../../../components/app/alert-system/contexts/alertActionHandler';
import { AlertMetricsProvider } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import { ConfirmAlertModal } from '../../../../components/app/alert-system/confirm-alert-modal';
import { useTemplateConfirmationAlerts } from './useTemplateConfirmationAlerts';

type TemplateAlertContextType = {
  hasAlerts: boolean;
  showAlertsModal: () => void;
};

const NopeFunction = () => undefined;

export const TemplateAlertContext = createContext<TemplateAlertContextType | undefined>(
  undefined,
);

export const TemplateAlertContextProvider: React.FC<{
  children: ReactElement;
  pendingConfirmation: ApprovalRequest<{ id: string }>;
  onCancel: () => void;
  onSubmit: () => void;
}> = ({ children, pendingConfirmation, onCancel, onSubmit }) => {
  const [isAlertsModalVisible, setAlertsModalVisible] = useState(false);
  const alertOwnerId = pendingConfirmation?.id;
  useTemplateConfirmationAlerts(alertOwnerId);
  const { hasAlerts } = useAlerts(alertOwnerId);

  // todo: action implementations to come here as alerts are implemented
  const processAction = useCallback((actionKey: string) => {
    switch (actionKey) {
      default:
        console.error('Unknown alert action key:', actionKey);
        break;
    }
  }, []);

  return (
    // AlertMetricsProvider is added as it is required for alert modals to work
    // metrics event capturing can be added if needed.
    <AlertMetricsProvider
      metrics={{
        trackAlertActionClicked: NopeFunction,
        trackAlertRender: NopeFunction,
        trackInlineAlertClicked: NopeFunction,
      }}
    >
      <AlertActionHandlerProvider onProcessAction={processAction}>
        <TemplateAlertContext.Provider
          value={{
            hasAlerts,
            showAlertsModal: () => setAlertsModalVisible(true),
          }}
        >
          <>
            {isAlertsModalVisible && (
              <ConfirmAlertModal
                ownerId={alertOwnerId}
                onClose={() => setAlertsModalVisible(false)}
                onCancel={onCancel}
                onSubmit={onSubmit}
              />
            )}
            {children}
          </>
        </TemplateAlertContext.Provider>
      </AlertActionHandlerProvider>
    </AlertMetricsProvider>
  );
};

export const useTemplateAlertContext = () => {
  const context = useContext(TemplateAlertContext);
  if (!context) {
    throw new Error(
      'useTemplateAlertContext must be used within an TemplateAlertContextProvider',
    );
  }
  return context;
};
