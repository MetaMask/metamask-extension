import React from 'react';
import { it } from '@jest/globals';
import { render, renderHook, screen } from '@testing-library/react';
import { AppLayoutProvider, useAppLayout } from './app-layout';

const Consumer = () => {
  const { isWideLayout } = useAppLayout();
  return <div data-testid="value">{String(isWideLayout)}</div>;
};

describe('app layout', () => {
  it('is the classic layout outside a provider', () => {
    const { result } = renderHook(() => useAppLayout());

    expect(result.current).toStrictEqual({ isWideLayout: false });
  });

  it.each([true, false])(
    'provides isWideLayout %s to its children',
    (isWideLayout) => {
      render(
        <AppLayoutProvider isWideLayout={isWideLayout}>
          <Consumer />
        </AppLayoutProvider>,
      );

      expect(screen.getByTestId('value')).toHaveTextContent(
        String(isWideLayout),
      );
    },
  );
});
