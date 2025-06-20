import React from 'react';
import { SimulationSettingsModal } from './simulation-settings-modal';
import configureStore from '../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Json } from '@metamask/utils';
import {
  applyTransactionContainersExisting,
  setEnableEnforcedSimulationsForTransaction,
  updateEditableParams,
} from '../../../../../store/actions';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { act } from 'react-dom/test-utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  CHAIN_IDS,
  TransactionContainerType,
  TransactionParams,
} from '@metamask/transaction-controller';

jest.mock('../../../../../store/actions');

const TRANSACTION_ID_MOCK = '1d7c08c0-fe54-11ee-9243-91b1e533746a';

function render({
  containerTypes,
  metamaskState = {},
  txParamsOriginal,
}: {
  containerTypes?: TransactionContainerType[];
  metamaskState?: Record<string, Json>;
  txParamsOriginal?: Partial<TransactionParams>;
} = {}) {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
    containerTypes,
    txParamsOriginal: txParamsOriginal as TransactionParams,
  });

  const store = configureStore(
    getMockConfirmStateForTransaction(contractInteraction, {
      metamask: metamaskState,
    }),
  );

  return renderWithConfirmContextProvider(<SimulationSettingsModal />, store);
}

describe('SimulationSettingsModal', () => {
  const setEnableEnforcedSimulationsForTransactionMock = jest.mocked(
    setEnableEnforcedSimulationsForTransaction,
  );

  const applyTransactionContainersExistingMock = jest.mocked(
    applyTransactionContainersExisting,
  );

  const updateEditableParamsMock = jest.mocked(updateEditableParams);

  beforeEach(() => {
    jest.resetAllMocks();
    updateEditableParamsMock.mockReturnValue(async () => ({} as never));
  });

  describe('renders', () => {
    it('enforced simulations toggle as enabled if default', () => {
      const { getByTestId } = render({
        metamaskState: { enableEnforcedSimulations: true },
      });

      expect(
        getByTestId('simulation-settings-modal-enable-enforced').getAttribute(
          'value',
        ),
      ).toBe('true');
    });

    it('enforced simulations toggle as enabled if overridden', () => {
      const { getByTestId } = render({
        metamaskState: {
          enableEnforcedSimulations: false,
          enableEnforcedSimulationsForTransactions: {
            [TRANSACTION_ID_MOCK]: true,
          },
        },
      });

      expect(
        getByTestId('simulation-settings-modal-enable-enforced').getAttribute(
          'value',
        ),
      ).toBe('true');
    });

    it('enforced simulations toggle as disabled if default', () => {
      const { getByTestId } = render({
        metamaskState: {
          enableEnforcedSimulations: false,
        },
      });

      expect(
        getByTestId('simulation-settings-modal-enable-enforced').getAttribute(
          'value',
        ),
      ).toBe('false');
    });

    it('enforced simulations toggle as disabled if overridden', () => {
      const { getByTestId } = render({
        metamaskState: {
          enableEnforcedSimulations: true,
          enableEnforcedSimulationsForTransactions: {
            [TRANSACTION_ID_MOCK]: false,
          },
        },
      });

      expect(
        getByTestId('simulation-settings-modal-enable-enforced').getAttribute(
          'value',
        ),
      ).toBe('false');
    });
  });

  describe('on update click', () => {
    it('sets enforced simulations enabled', async () => {
      const { getByTestId } = render({
        metamaskState: {
          enableEnforcedSimulations: true,
          enableEnforcedSimulationsForTransactions: {},
        },
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-enable-enforced').click();
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-update').click();
      });

      expect(
        setEnableEnforcedSimulationsForTransactionMock,
      ).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, false);
    });

    it('applies enforced simulations if enabled and not already applied', async () => {
      const { getByTestId } = render({
        metamaskState: {
          enableEnforcedSimulations: false,
          enableEnforcedSimulationsForTransactions: {},
        },
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-enable-enforced').click();
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-update').click();
      });

      expect(applyTransactionContainersExisting).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        [TransactionContainerType.EnforcedSimulations],
      );
    });

    it('reverts to original parameters if enforced simulations disabled but applied', async () => {
      const { getByTestId } = render({
        containerTypes: [TransactionContainerType.EnforcedSimulations],
        metamaskState: {
          enableEnforcedSimulations: true,
          enableEnforcedSimulationsForTransactions: {},
        },
        txParamsOriginal: {
          data: '0x1',
          gas: '0x2',
          to: '0x3',
        },
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-enable-enforced').click();
      });

      await act(async () => {
        getByTestId('simulation-settings-modal-update').click();
      });

      expect(applyTransactionContainersExisting).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        [],
      );
    });
  });
});
