import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { showModal, toggleNetworkMenu } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RpcUrlEditor } from './rpc-url-editor';

// Mock useDispatch
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('RpcUrlEditor', () => {
  const useDispatchMock = useDispatch as jest.Mock;
  const mockOnRpcUrlAdd = jest.fn();
  const mockOnRpcSelected = jest.fn();
  const useI18nContextMock = useI18nContext as jest.Mock;
  const mockDispatch = jest.fn();

  const defaultProps = {
    currentRpcUrl: 'https://current-rpc-url.com',
    onRpcUrlAdd: mockOnRpcUrlAdd,
    onRpcSelected: mockOnRpcSelected,
    dummyRpcUrls: [
      { url: 'https://rpc-url-1.com', selected: false },
      { url: 'https://rpc-url-2.com', selected: true },
    ],
  };

  beforeEach(() => {
    useDispatchMock.mockReturnValue(mockDispatch);
    useI18nContextMock.mockReturnValue((key: string) => key);
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<RpcUrlEditor {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('should toggle the dropdown when clicked', () => {
    render(<RpcUrlEditor {...defaultProps} />);

    const dropdown = screen.getByText('https://current-rpc-url.com');
    fireEvent.click(dropdown);
    expect(screen.getByText('https://rpc-url-1.com')).toBeVisible();

    fireEvent.click(dropdown);
    expect(screen.queryByText('https://rpc-url-1.com')).not.toBeInTheDocument();
  });

  it('should call onRpcUrlAdd when "Add RPC URL" button is clicked', () => {
    render(<RpcUrlEditor {...defaultProps} />);

    const dropdown = screen.getByText('https://current-rpc-url.com');
    fireEvent.click(dropdown);

    const addButton = screen.getByText('addRpcUrl');
    fireEvent.click(addButton);

    expect(mockOnRpcUrlAdd).toHaveBeenCalled();
  });

  it('should dispatch actions when delete button is clicked', () => {
    render(<RpcUrlEditor {...defaultProps} />);

    const dropdown = screen.getByText('https://current-rpc-url.com');
    fireEvent.click(dropdown);

    const deleteButton = screen.getAllByLabelText('delete')[0];
    fireEvent.click(deleteButton);

    expect(mockDispatch).toHaveBeenCalledWith(toggleNetworkMenu());
    expect(mockDispatch).toHaveBeenCalledWith(
      showModal({ name: 'CONFIRM_DELETE_RPC_URL' }),
    );
  });
});
