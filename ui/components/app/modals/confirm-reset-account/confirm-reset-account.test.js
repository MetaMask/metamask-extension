import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import ConfirmResetAccount from '.';

describe('Confirm Reset Account', () => {
  const props = {
    hideModal: jest.fn(),
    resetAccount: jest.fn().mockResolvedValue(),
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConfirmResetAccount.WrappedComponent {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('hides modal when nevermind button is clicked', () => {
    const { getByText } = renderWithProvider(
      <ConfirmResetAccount.WrappedComponent {...props} />,
    );

    fireEvent.click(getByText('Nevermind'));

    expect(props.resetAccount).not.toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('resets account and hides modal when reset button is clicked', async () => {
    const { getByText } = renderWithProvider(
      <ConfirmResetAccount.WrappedComponent {...props} />,
    );

    await fireEvent.click(getByText('Clear'));

    expect(props.resetAccount).toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });
});
