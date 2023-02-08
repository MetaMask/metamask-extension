import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  yesLetsTry,
  nevermind,
} from '../../../../../app/_locales/en/messages.json';
import CancelTransaction from '.';

const mockCreateCancelTransaction = jest.fn();
const mockShowModal = jest.fn();
const mockHideModal = jest.fn();

jest.mock('../../../../store/actions.ts', () => {
  return {
    createCancelTransaction: () => mockCreateCancelTransaction,
    showModal: () => mockShowModal,
    hideModal: () => mockHideModal,
  };
});

describe('CancelTransaction Component', () => {
  afterEach(() => {
    mockCreateCancelTransaction.mockClear();
    mockShowModal.mockClear();
    mockHideModal.mockClear();
  });

  const props = {
    newGasFee: '0x1319718a5000', // 21000000000000
  };

  it('should match snapshot', () => {
    const mockStore = configureMockStore()(mockState);

    const { container } = renderWithProvider(
      <CancelTransaction {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call create cancel transaction and hide modal', async () => {
    const mockStore = configureMockStore([thunk])(mockState);

    const { queryByText } = renderWithProvider(
      <CancelTransaction />,
      mockStore,
    );

    fireEvent.click(queryByText(yesLetsTry.message));

    await waitFor(() => {
      expect(mockCreateCancelTransaction).toHaveBeenCalled();
      expect(mockHideModal).toHaveBeenCalled();
    });
  });

  it('should hide modal when clicking "Nevermind" button', () => {
    const mockStore = configureMockStore([thunk])(mockState);

    const { queryByText } = renderWithProvider(
      <CancelTransaction />,
      mockStore,
    );

    fireEvent.click(queryByText(nevermind.message));

    expect(mockCreateCancelTransaction).not.toHaveBeenCalled();
    expect(mockHideModal).toHaveBeenCalled();
  });

  it('should hide modal when closing from header', () => {
    const mockStore = configureMockStore([thunk])(mockState);

    const { queryByTestId } = renderWithProvider(
      <CancelTransaction {...props} />,
      mockStore,
    );

    fireEvent.click(queryByTestId('modal-header-close'));

    expect(mockCreateCancelTransaction).not.toHaveBeenCalled();
    expect(mockHideModal).toHaveBeenCalled();
  });
});
