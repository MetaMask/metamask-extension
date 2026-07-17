import { act, render } from '@testing-library/react';
import React from 'react';

import { toast } from '../../../components/ui/toast/toast';
import {
  ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS,
  AssetActivationErrorToast,
} from './asset-activation-error-toast';

jest.mock('../../../components/ui/toast/toast', () => {
  const actual = jest.requireActual<
    typeof import('../../../components/ui/toast/toast')
  >('../../../components/ui/toast/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: jest.fn(),
      dismiss: jest.fn(),
    },
  };
});

describe('AssetActivationErrorToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not show a toast when message is null', () => {
    render(<AssetActivationErrorToast message={null} onClose={jest.fn()} />);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows the error toast when message is set', () => {
    render(
      <AssetActivationErrorToast
        message="Trustline activation test error"
        onClose={jest.fn()}
      />,
    );

    expect(toast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Trustline activation test error',
          dataTestId: 'asset-activation-error-container',
        }),
      }),
      {
        id: 'asset-activation-error-toast',
        duration: ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS,
      },
    );
  });

  it('calls onClose after the toast auto-hides', () => {
    const onClose = jest.fn();

    render(
      <AssetActivationErrorToast
        message="Trustline activation test error"
        onClose={onClose}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
