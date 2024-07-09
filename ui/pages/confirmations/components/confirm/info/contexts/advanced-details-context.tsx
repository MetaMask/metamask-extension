import React, { ReactElement, createContext, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConfirmationAdvancedDetailsOpen } from '../../../../../../selectors';
import { setConfirmationAdvancedDetailsOpen } from '../../../../../../store/actions';

type AdvancedDetailsHandlerContextType = {
  showAdvancedDetails: boolean;
  setShowAdvancedDetails: (value: boolean) => void;
};

export const AdvancedDetailsHandlerContext = createContext<
  AdvancedDetailsHandlerContextType | undefined
>(undefined);

export const AdvancedDetailsProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const dispatch = useDispatch();

  const showAdvancedDetails = useSelector(getConfirmationAdvancedDetailsOpen);
  const setShowAdvancedDetails = (value: boolean): void => {
    dispatch(setConfirmationAdvancedDetailsOpen(value));
  };

  const advancedDetailsObject = useMemo(
    () => ({ showAdvancedDetails, setShowAdvancedDetails }),
    [showAdvancedDetails, setShowAdvancedDetails],
  );

  return (
    <AdvancedDetailsHandlerContext.Provider value={advancedDetailsObject}>
      {children}
    </AdvancedDetailsHandlerContext.Provider>
  );
};

export const useAdvancedDetailsHandler = () => {
  const context = useContext(AdvancedDetailsHandlerContext);
  if (!context) {
    throw new Error(
      'useAdvancedDetailsHandler must be used within an AdvancedDetailsProvider',
    );
  }
  return context;
};
