import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { MUSD_CONVERSION_APY } from '../../../../../components/app/musd/constants';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { useIsTransactionPayLoading } from '../../../hooks/pay/useTransactionPayData';
import { ClaimableBonusRow } from './claimable-bonus-row';

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockStore = configureMockStore([]);

function render(props: { rowVariant?: ConfirmInfoRowSize } = {}) {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <ClaimableBonusRow {...props} />,
    mockStore(state),
  );
}

describe('ClaimableBonusRow', () => {
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    useIsTransactionPayLoadingMock.mockReturnValue(false);
  });

  it('renders skeleton when loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('claimable-bonus-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('claimable-bonus-row')).not.toBeInTheDocument();
  });

  it('renders the claimable bonus row with APY value', () => {
    const { getByTestId } = render();

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
    expect(getByTestId('claimable-bonus-value')).toHaveTextContent(
      `${MUSD_CONVERSION_APY}%`,
    );
  });

  it('opens tooltip popover when info button is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('claimable-bonus-row-tooltip'));

    expect(
      getByTestId('claimable-bonus-tooltip-popover'),
    ).toBeInTheDocument();
  });

  it('closes tooltip popover when clicking outside', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('claimable-bonus-row-tooltip'));
    expect(
      getByTestId('claimable-bonus-tooltip-popover'),
    ).toBeInTheDocument();

    fireEvent.click(document.body);
  });

  it('renders with Small variant', () => {
    const { getByTestId } = render({
      rowVariant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
    expect(getByTestId('claimable-bonus-value')).toHaveTextContent(
      `${MUSD_CONVERSION_APY}%`,
    );
  });

  it('renders with Default variant by default', () => {
    const { getByTestId } = render();

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
  });
});
