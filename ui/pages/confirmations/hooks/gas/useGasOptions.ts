import { GasModalType } from '../../constants/gas';
import { type GasOption } from '../../types/gas';
import { useAdvancedGasFeeOption } from './useAdvancedGasFeeOption';
import { useGasFeeEstimateLevelOptions } from './useGasFeeEstimateLevelOptions';
import { useGasPriceEstimateOption } from './useGasPriceEstimateOption';
import { useDappSuggestedGasFeeOption } from './useDappSuggestedGasFeeOption';

export const useGasOptions = ({
  handleCloseModals,
  setActiveModal,
}: {
  handleCloseModals: () => void;
  setActiveModal: (modal: GasModalType) => void;
}) => {
  const advancedGasFeeOptions = useAdvancedGasFeeOption({
    setActiveModal,
  });

  const gasFeeEstimateLevelOptions = useGasFeeEstimateLevelOptions({
    handleCloseModals,
  });

  const gasPriceEstimateOptions = useGasPriceEstimateOption({
    handleCloseModals,
  });

  const dappSuggestedGasFeeOption = useDappSuggestedGasFeeOption({
    handleCloseModals,
  });

  const options: GasOption[] = [
    ...gasFeeEstimateLevelOptions,
    ...gasPriceEstimateOptions,
    ...dappSuggestedGasFeeOption,
    ...advancedGasFeeOptions,
  ];

  return {
    options,
  };
};
