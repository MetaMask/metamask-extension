import React, { ReactNode } from 'react';
import configureMockStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import { act } from '@testing-library/react';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
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
    decimals: 18,
    userBalance: '1000000',
    tokenSymbol: 'TST',
  })),
}));

function render({ onSubmit }: { onSubmit?: (data: Hex) => void } = {}) {
  const state = getMockApproveConfirmState();
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
