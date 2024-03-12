import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { NotificationDetailCopyButton } from './notification-detail-copy-button';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn().mockReturnValue([false, jest.fn()]),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn().mockReturnValue((key: string) => key),
}));

describe('NotificationDetailCopyButton', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <NotificationDetailCopyButton
        text="test text"
        displayText="display text"
      />,
    );
    expect(getByTestId('address-copy-button-text')).toBeInTheDocument();
  });

  it('calls handleCopy when clicked', () => {
    const handleCopy = jest.fn();
    (useCopyToClipboard as jest.Mock).mockReturnValue([false, handleCopy]);

    const { getByTestId } = render(
      <NotificationDetailCopyButton
        text="test text"
        displayText="display text"
      />,
    );

    fireEvent.click(getByTestId('address-copy-button-text'));
    expect(handleCopy).toHaveBeenCalledWith('test text');
  });
});
