import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { showModal, toggleNetworkMenu } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { URLEditor } from './url-editor';

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
  const mockOnRpcUrlDeleted = jest.fn();
  const mockOnExplorerUrlSelected = jest.fn();
  const useI18nContextMock = useI18nContext as jest.Mock;
  const mockDispatch = jest.fn();
  const mockSetBlockExplorerUrl = jest.fn();
  const mockOnExplorerUrlDeleted = jest.fn();
  const mockSetRpcUrls = jest.fn();

  const defaultProps = {
    chainId: '0x1',
    currentRpcUrl: 'https://current-rpc-url.com',
    onUrlAdd: mockOnRpcUrlAdd,
    onRpcUrlSelected: mockOnRpcSelected,
    onRpcUrlDeleted: mockOnRpcUrlDeleted,
    onExplorerUrlSelected: mockOnExplorerUrlSelected,
    endpointsList: [
      { url: 'https://rpc-url-1.com', selected: false },
      { url: 'https://rpc-url-2.com', selected: true },
    ],
    indexUsedEndpoint: 0,
    title: 'test',
    buttonTitle: 'test2',
    setBlockExplorerUrl: mockSetBlockExplorerUrl,

    onExplorerUrlDeleted: mockOnExplorerUrlDeleted,
    setRpcUrls: mockSetRpcUrls,
    isRpc: true,
  };

  beforeEach(() => {
    useDispatchMock.mockReturnValue(mockDispatch);
    useI18nContextMock.mockReturnValue((key: string) => key);
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<URLEditor {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('should toggle the dropdown when clicked', () => {
    render(<URLEditor {...defaultProps} />);

    const dropdown = screen.getByText('https://current-rpc-url.com');
    fireEvent.click(dropdown);
    expect(screen.getByText('https://rpc-url-1.com')).toBeVisible();

    fireEvent.click(dropdown);
    expect(screen.queryByText('https://rpc-url-1.com')).not.toBeInTheDocument();
  });

  it('should call onRpcUrlAdd when "Add RPC URL" button is clicked', () => {
    render(<URLEditor {...defaultProps} />);

    const dropdown = screen.getByText('https://current-rpc-url.com');
    fireEvent.click(dropdown);

    const addButton = screen.getByText('addRpcUrl');
    fireEvent.click(addButton);

    expect(mockOnRpcUrlAdd).toHaveBeenCalled();
  });

  it('should dispatch actions when delete button is clicked', () => {
    render(<URLEditor {...defaultProps} />);

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
