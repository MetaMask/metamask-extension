import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import { MusdConversionHeader } from './musd-conversion-header';

const genMusdConversionConfirmation = () => {
  const base = genUnapprovedContractInteractionConfirmation({
    chainId: '0x1',
  });
  return {
    ...base,
    type: TransactionType.musdConversion,
    origin: 'metamask',
  };
};

const getMockMusdConversionConfirmState = () => {
  return getMockConfirmStateForTransaction(genMusdConversionConfirmation());
};

const render = (
  state: DefaultRootState = getMockMusdConversionConfirmState(),
) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<MusdConversionHeader />, store);
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('<MusdConversionHeader />', () => {
  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('renders the "Convert and get 3%" title', () => {
    const { getByTestId } = render();

    expect(getByTestId('musd-conversion-header-title')).toHaveTextContent(
      'Convert and get 3%',
    );
  });

  it('renders the back button', () => {
    const { getByTestId } = render();

    expect(
      getByTestId('musd-conversion-header-back-button'),
    ).toBeInTheDocument();
  });

  it('renders the info button', () => {
    const { getByTestId } = render();

    expect(
      getByTestId('musd-conversion-header-info-button'),
    ).toBeInTheDocument();
  });

  it('calls onCancel when back button is pressed', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));

    const { getByTestId } = render();
    fireEvent.click(getByTestId('musd-conversion-header-back-button'));

    expect(mockOnCancel).toHaveBeenCalledWith({
      location: 'confirmation',
      navigateBackForSend: true,
    });
  });

  it('shows tooltip when info button is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('musd-conversion-header-info-button'));

    expect(getByTestId('musd-conversion-header-tooltip')).toBeInTheDocument();
  });
});
