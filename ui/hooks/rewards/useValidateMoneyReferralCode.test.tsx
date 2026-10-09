import React, { useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { useValidateMoneyReferralCode } from './useValidateMoneyReferralCode';

const mockValidate = jest.fn();
const validateMessenger = {
  call: (_action: string, code: string) => mockValidate(code),
};
const mockT = (key: string) => key;

jest.mock('../useMessenger', () => ({
  useMessenger: () => validateMessenger,
}));

jest.mock('../useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

const Harness = ({ initialCode }: { initialCode: string }) => {
  const [code, setCode] = useState(initialCode);
  const validation = useValidateMoneyReferralCode(code);
  return (
    <div>
      <button type="button" onClick={() => setCode('GOOD1')}>
        edit
      </button>
      <span data-testid="rejected">{String(validation.isRejectedCode)}</span>
      <span data-testid="unknown">{String(validation.isUnknownError)}</span>
      <span data-testid="valid">{String(validation.isValid)}</span>
    </div>
  );
};

describe('useValidateMoneyReferralCode', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockValidate.mockReset();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('debounces a rejected code and still allows accept after a network error', async () => {
    mockValidate.mockResolvedValueOnce({ success: false });
    const store = configureStore({ reducer: (state = {}) => state });
    const view = render(
      <Provider store={store}>
        <Harness initialCode="BAD1" />
      </Provider>,
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(view.getByTestId('rejected').textContent).toBe('true');
    expect(view.getByTestId('valid').textContent).toBe('false');
    expect(mockValidate).toHaveBeenCalledWith('BAD1');

    mockValidate.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      view.getByRole('button', { name: 'edit' }).click();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(view.getByTestId('unknown').textContent).toBe('true');
    expect(view.getByTestId('valid').textContent).toBe('true');
  });
});
