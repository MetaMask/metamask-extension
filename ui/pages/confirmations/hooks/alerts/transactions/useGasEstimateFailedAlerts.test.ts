
import { useContext } from "react";
import { selectTransactionMetadata } from "../../../../../selectors";
import useCurrentConfirmation from "../../useCurrentConfirmation";
import { useGasEstimateFailedAlerts } from "./useGasEstimateFailedAlerts";
import { Severity } from "../../../../../helpers/constants/design-system";
import { RowAlertKey } from "../../../../../components/app/confirm/info/row/constants";

jest.mock('../../useCurrentConfirmation');

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (fn: any) => fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (fn: any) => fn(),
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../selectors', () => ({
  selectTransactionMetadata: jest.fn(),
}));

const TRANSACTION_ID_MOCK = '123-456';

describe('useGasEstimateFailedAlerts', () => {
  const selectTransactionMetadataMock = jest.mocked(selectTransactionMetadata);
  const useCurrentConfirmationMock = jest.mocked(useCurrentConfirmation);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    useCurrentConfirmationMock.mockReturnValueOnce({
      currentConfirmation: undefined
    });

    expect(useGasEstimateFailedAlerts()).toEqual([]);
  });

  it('returns no alerts if no transaction matching ID', () => {
    useCurrentConfirmationMock.mockReturnValueOnce({
      currentConfirmation: {id: TRANSACTION_ID_MOCK}
    });

    selectTransactionMetadataMock.mockReturnValueOnce(undefined);

    expect(useGasEstimateFailedAlerts()).toEqual([]);
  });

  it('returns no alerts if transaction has no simulation error data', () => {
    useCurrentConfirmationMock.mockReturnValueOnce({
      currentConfirmation: {id: TRANSACTION_ID_MOCK}
    });

    selectTransactionMetadataMock.mockReturnValueOnce({
      simulationFails: undefined
    });

    expect(useGasEstimateFailedAlerts()).toEqual([]);
  });

  it('returns alert if transaction has simulation error data', () => {
    useCurrentConfirmationMock.mockReturnValueOnce({
      currentConfirmation: {id: TRANSACTION_ID_MOCK}
    });

    selectTransactionMetadataMock.mockReturnValueOnce({
      simulationFails: {}
    });

    expect(useGasEstimateFailedAlerts()).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        message: 'simulationErrorMessageV2',
        reason: 'Gas Estimation Failed',
        severity: Severity.Danger
      }
    ]);
  });
});