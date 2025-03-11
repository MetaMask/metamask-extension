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
import { MultipleAlertModal } from '../../../../components/app/alert-system/multiple-alert-modal';
import { useTemplateConfirmationAlerts } from './useTemplateConfirmationAlerts';
import { useAlertsActions } from './useAlertsActions';

type TemplateAlertContextType = {
  hasAlerts: boolean;
  showAlertsModal: () => void;
};

const NopeFunction = () => undefined;

export const TemplateAlertContext = createContext<
  TemplateAlertContextType | undefined
>(undefined);

export const TemplateAlertContextProvider: React.FC<{
  children: ReactElement;
  pendingConfirmation: ApprovalRequest<{ id: string }>;
  onSubmit: () => void;
}> = ({ children, pendingConfirmation, onSubmit }) => {
  const [isAlertsModalVisible, setAlertsModalVisible] = useState(false);
  const alertOwnerId = pendingConfirmation?.id;
  useTemplateConfirmationAlerts(pendingConfirmation);
  const { hasAlerts } = useAlerts(alertOwnerId);

  const showAlertsModal = useCallback(() => {
    setAlertsModalVisible(true);
  }, [setAlertsModalVisible]);

  const hideAlertModal = useCallback(() => {
    setAlertsModalVisible(false);
  }, [setAlertsModalVisible]);

  const onFinalSubmit = useCallback(() => {
    hideAlertModal();
    onSubmit();
  }, [hideAlertModal, onSubmit]);

  const processAction = useAlertsActions(hideAlertModal, pendingConfirmation);

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
            showAlertsModal,
          }}
        >
          <>
            {isAlertsModalVisible && (
              <MultipleAlertModal
                ownerId={alertOwnerId}
                onFinalAcknowledgeClick={onFinalSubmit}
                onClose={hideAlertModal}
                showCloseIcon={false}
                displayAllAlerts
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
