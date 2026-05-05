import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  TransactionGroupCategory,
  TransactionGroupStatus,
} from '../../../../shared/constants/transaction';
import TransactionIcon from '.';

const mockCaptureSingleException = jest.fn();
jest.mock('../../../store/actions', () => ({
  captureSingleException: (msg: string) => {
    mockCaptureSingleException(msg);
    return { type: 'CAPTURE_SINGLE_EXCEPTION', payload: msg };
  },
}));

const mockStore = configureStore();
const store = mockStore({});

function renderIcon(props: React.ComponentProps<typeof TransactionIcon>) {
  return render(
    <Provider store={store}>
      <TransactionIcon {...props} />
    </Provider>,
  );
}

describe('TransactionIcon', () => {
  beforeEach(() => {
    store.clearActions();
    mockCaptureSingleException.mockClear();
  });

  it('renders an icon for a known category without logging an exception', () => {
    const { container } = renderIcon({
      status: TransactionStatus.confirmed,
      category: TransactionGroupCategory.send,
    });

    const avatarIcon = container.querySelector('.mm-avatar-icon');
    expect(avatarIcon).toBeInTheDocument();
    expect(mockCaptureSingleException).not.toHaveBeenCalled();
  });

  it('renders a fallback icon and logs when category is undefined', () => {
    jest.spyOn(console, 'error').mockImplementation();

    const { container } = renderIcon({
      status: TransactionGroupStatus.pending,
      category: undefined,
    });

    const avatarIcon = container.querySelector('.mm-avatar-icon');
    expect(avatarIcon).toBeInTheDocument();

    expect(mockCaptureSingleException).toHaveBeenCalledWith(
      'The category prop passed to TransactionIcon is not supported. The prop is: undefined',
    );
  });

  it('renders a fallback icon and logs when category is unsupported', () => {
    jest.spyOn(console, 'error').mockImplementation();

    const { container } = renderIcon({
      status: TransactionStatus.confirmed,
      category: 'some-unknown-category',
    });

    const avatarIcon = container.querySelector('.mm-avatar-icon');
    expect(avatarIcon).toBeInTheDocument();

    expect(mockCaptureSingleException).toHaveBeenCalledWith(
      'The category prop passed to TransactionIcon is not supported. The prop is: some-unknown-category',
    );
  });
});
