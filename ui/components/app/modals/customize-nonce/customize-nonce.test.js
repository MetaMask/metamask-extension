import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import CustomizeNonce from '.';

const mockHideModal = jest.fn();

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  hideModal: () => mockHideModal,
}));

describe('Customize Nonce', () => {
  const mockState = {
    appState: {
      modal: {
        modalState: {
          props: {},
        },
      },
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  const props = {
    nextNonce: 1,
    customNonceValue: '',
    updateCustomNonce: jest.fn(),
    getNextNonce: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <CustomizeNonce {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should change and submit custom nonce', async () => {
    const { queryByTestId, queryByText } = renderWithProvider(
      <CustomizeNonce {...props} />,
      mockStore,
    );

    const nonceInputEvent = {
      target: {
        value: 101,
      },
    };

    const nonceInput = queryByTestId('custom-nonce-input');
    fireEvent.change(nonceInput, nonceInputEvent);
    expect(nonceInput).toHaveValue(101);

    const saveButton = queryByText('Save');
    fireEvent.click(saveButton);

    expect(props.updateCustomNonce).toHaveBeenCalledWith('101');
    expect(props.getNextNonce).toHaveBeenCalled();
    expect(mockHideModal).toHaveBeenCalled();
  });

  it('should handle emptry string custom nonce', () => {
    const { queryByTestId, queryByText } = renderWithProvider(
      <CustomizeNonce {...props} />,
      mockStore,
    );

    const nonceInputEvent = {
      target: {
        value: '',
      },
    };

    const nonceInput = queryByTestId('custom-nonce-input');
    fireEvent.change(nonceInput, nonceInputEvent);

    const saveButton = queryByText('Save');

    fireEvent.click(saveButton);

    expect(props.updateCustomNonce).toHaveBeenCalledWith(
      props.customNonceValue,
    );
  });

  it('should handle cancel', async () => {
    const { queryByText } = renderWithProvider(
      <CustomizeNonce {...props} />,
      mockStore,
    );

    const modalClose = queryByText('Cancel');

    fireEvent.click(modalClose);

    expect(mockHideModal).toHaveBeenCalled();
  });

  it('should handle reset of nonce', async () => {
    const { queryByTestId } = renderWithProvider(
      <CustomizeNonce {...props} />,
      mockStore,
    );

    const resetNonce = queryByTestId('customize-nonce-reset');

    const nonceInputEvent = {
      target: {
        value: 101,
      },
    };

    const nonceInput = queryByTestId('custom-nonce-input');

    fireEvent.change(nonceInput, nonceInputEvent);
    expect(nonceInput).toHaveValue(101);

    fireEvent.click(resetNonce);

    expect(nonceInput).toHaveValue(props.nextNonce);
  });
});
