import React, {
  ReactElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { getSendHexDataFeatureFlagState } from '../../../../../../ducks/metamask/metamask';
import { getUseNonceField } from '../../../../../../selectors';

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
  const enableCustomNonce = useSelector(getUseNonceField);
  const showHexData = useSelector(getSendHexDataFeatureFlagState);

  const [showAdvancedDetails, setShowAdvancedDetails] = useState(
    enableCustomNonce || showHexData,
  );

  const advancedDetailsObject = useMemo(
    () => ({
      showAdvancedDetails,
      setShowAdvancedDetails,
    }),
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
