import React, { ReactNode } from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  countDecimalDigits,
  EditSpendingCapModal,
} from './edit-spending-cap-modal';

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
}));

jest.mock('../hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
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

describe('<EditSpendingCapModal />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const isOpenEditSpendingCapModal = true;
    const setIsOpenEditSpendingCapModal = () =>
      console.log('setIsOpenEditSpendingCapModal');

    const { container } = renderWithConfirmContextProvider(
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
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
