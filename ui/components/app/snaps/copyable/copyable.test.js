import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { renderWithProvider } from '../../../../../test/jest';
import { Copyable } from './copyable';

jest.mock('../../../../hooks/useCopyToClipboard');

describe('Copyable', () => {
  const handleCopy = jest.fn();
  beforeEach(() => {
    useCopyToClipboard.mockReturnValue([false, handleCopy]);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });
  const value = 'foo bar';
  it('renders a copyable component', () => {
    const { getByText } = renderWithProvider(<Copyable text={value} />);

    expect(getByText(value)).toBeInTheDocument();
  });

  it('copies the text value', async () => {
    const { getByTestId } = renderWithProvider(<Copyable text={value} />);
    const copyIcon = getByTestId('copy-icon');

    fireEvent.click(copyIcon);

    await waitFor(() => {
      expect(handleCopy).toHaveBeenCalledWith(value);
    });
  });

  it('hides the value and hides copy icon if sensitive is set to true', () => {
    const { getByText, queryByTestId } = renderWithProvider(
      <Copyable text={value} sensitive />,
    );

    expect(getByText('Reveal sensitive content')).toBeInTheDocument();
    expect(queryByTestId('copy-icon')).not.toBeInTheDocument();
  });

  it('reveals the value and the copy icon if the reveal icon is clicked', async () => {
    const { getByTestId, getByText } = renderWithProvider(
      <Copyable text={value} sensitive />,
    );
    const revealIcon = getByTestId('reveal-icon');
    fireEvent.click(revealIcon);

    const copyIcon = getByTestId('copy-icon');
    fireEvent.click(copyIcon);

    expect(getByText(value)).toBeInTheDocument();
    await waitFor(() => {
      expect(handleCopy).toHaveBeenCalledWith(value);
    });
  });
});
