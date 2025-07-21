import React, { ReactNode } from 'react';
import configureMockStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import { act, fireEvent } from '@testing-library/react';
import {
  getMockApproveConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { buildPermit2ApproveTransactionData } from '../../../../../../../../test/data/confirmations/token-approve';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import {
  countDecimalDigits,
  EditSpendingCapModal,
} from './edit-spending-cap-modal';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: ReactNode) => node,
}));

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
  updateEditableParams: jest.fn(),
}));

jest.mock('../hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
}));

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 4,
    userBalance: '1000000',
    tokenSymbol: 'TST',
  })),
}));

const ADDRESS_MOCK = '0x1234567890123456789012345678901234567890';
const ADDRESS_MOCK_2 = '0x1234567890123456789012345678901234567891';

function render({
  transactionData,
  onSubmit,
}: { transactionData?: Hex; onSubmit?: (data: Hex) => void } = {}) {
  const state = transactionData
    ? getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          txData: transactionData,
        }),
      )
    : getMockApproveConfirmState();

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <EditSpendingCapModal
      isOpenEditSpendingCapModal={true}
      onSubmit={onSubmit}
      setIsOpenEditSpendingCapModal={() => {
        // Intentionally empty
      }}
    />,
    mockStore,
  );
}

describe('EditSpendingCapModal', () => {
  it('renders component', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('invokes onSubmit when submit button clicked', async () => {
    const onSubmit = jest.fn();
    const { getByText } = render({ onSubmit });
    const submitButton = getByText('Save');

    await act(async () => {
      submitButton.click();
    });

    expect(onSubmit).toHaveBeenCalled();
  });

  it('supports Permit2 approval', async () => {
    const onSubmit = jest.fn();

    const { getByText, getByTestId } = render({
      onSubmit,
      transactionData: buildPermit2ApproveTransactionData(
        ADDRESS_MOCK,
        ADDRESS_MOCK_2,
        78900,
        456,
      ),
    });

    await act(async () => {
      fireEvent.change(getByTestId('custom-spending-cap-input'), {
        target: { value: '1.23' },
      });
    });

    await act(async () => {
      getByText('Save').click();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      buildPermit2ApproveTransactionData(
        ADDRESS_MOCK,
        ADDRESS_MOCK_2,
        12300,
        456,
      ),
    );

    expect(jest.mocked(useAssetDetails)).toHaveBeenCalledWith(
      ADDRESS_MOCK,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  describe('countDecimalDigits()', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { numberString: '0', expectedDecimals: 0 },
      { numberString: '100', expectedDecimals: 0 },
      { numberString: '100.123', expectedDecimals: 3 },
      { numberString: '3.141592654', expectedDecimals: 9 },
    ])(
      'should return $expectedDecimals decimals for `$numberString`',
      ({
        numberString,
        expectedDecimals,
      }: {
        numberString: string;
        expectedDecimals: number;
      }) => {
        const actual = countDecimalDigits(numberString);

        expect(actual).toEqual(expectedDecimals);
      },
    );
  });
});
