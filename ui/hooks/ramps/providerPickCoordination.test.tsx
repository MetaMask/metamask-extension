import { renderHook } from '@testing-library/react';
import {
  isBuyScreenOwningProviderPick,
  useBuyScreenOwnsProviderPick,
} from './providerPickCoordination';

describe('providerPickCoordination', () => {
  it('keeps ownership until the last mounted Buy screen unmounts', () => {
    const first = renderHook(() => useBuyScreenOwnsProviderPick());
    const second = renderHook(() => useBuyScreenOwnsProviderPick());

    first.unmount();

    expect(isBuyScreenOwningProviderPick()).toBe(true);

    second.unmount();

    expect(isBuyScreenOwningProviderPick()).toBe(false);
  });
});
