import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { SUPPORT_CONFIG } from '../../../../shared/constants/perps';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../hooks/perps';
import { AccessRestrictedModal } from './access-restricted-modal';

type AccessRestrictedContextValue = {
  showAccessRestrictedModal: () => void;
  hideAccessRestrictedModal: () => void;
  isAccessRestricted: boolean;
};

const AccessRestrictedContext =
  createContext<AccessRestrictedContextValue | null>(null);

export type AccessRestrictedProviderProps = {
  children: ReactNode;
};

export const AccessRestrictedProvider = ({
  children,
}: AccessRestrictedProviderProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { track } = usePerpsEventTracking();

  const showAccessRestrictedModal = useCallback(() => {
    setIsVisible(true);
    track(MetaMetricsEventName.PerpsScreenViewed, {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.COMPLIANCE_BLOCK_NOTIF,
    });
  }, [track]);

  const hideAccessRestrictedModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleContactSupport = useCallback(() => {
    hideAccessRestrictedModal();
    globalThis.platform.openTab({ url: SUPPORT_CONFIG.Url });
  }, [hideAccessRestrictedModal]);

  const value = useMemo(
    () => ({
      showAccessRestrictedModal,
      hideAccessRestrictedModal,
      isAccessRestricted: isVisible,
    }),
    [showAccessRestrictedModal, hideAccessRestrictedModal, isVisible],
  );

  return (
    <AccessRestrictedContext.Provider value={value}>
      {children}
      <AccessRestrictedModal
        isOpen={isVisible}
        onClose={hideAccessRestrictedModal}
        onContactSupport={handleContactSupport}
      />
    </AccessRestrictedContext.Provider>
  );
};

export const useAccessRestrictedModal = (): AccessRestrictedContextValue => {
  const context = useContext(AccessRestrictedContext);
  if (!context) {
    throw new Error(
      'useAccessRestrictedModal must be used within AccessRestrictedProvider',
    );
  }
  return context;
};
