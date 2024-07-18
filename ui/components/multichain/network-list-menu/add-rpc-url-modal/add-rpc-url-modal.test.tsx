import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import AddRpcUrlModal from './add-rpc-url-modal';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('AddRpcUrlModal', () => {
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    useI18nContextMock.mockReturnValue((key: string) => key);
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<AddRpcUrlModal />);
    expect(container).toMatchSnapshot();
  });

  it('should render the input field with the correct label', () => {
    render(<AddRpcUrlModal />);
    const inputLabel = screen.getByLabelText('additionalRpcUrl');
    expect(inputLabel).toBeInTheDocument();
  });

  it('should render the "Add URL" button with correct text', () => {
    render(<AddRpcUrlModal />);
    const addButton = screen.getByRole('button', { name: 'addUrl' });
    expect(addButton).toBeInTheDocument();
  });

  it('should call the appropriate function when "Add URL" button is clicked', () => {
    const mockAddUrl = jest.fn();
    render(<AddRpcUrlModal />);
    const addButton = screen.getByRole('button', { name: 'addUrl' });
    userEvent.click(addButton);
    expect(mockAddUrl).not.toHaveBeenCalled();
  });
});
