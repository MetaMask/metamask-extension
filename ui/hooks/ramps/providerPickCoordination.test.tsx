import { renderHook } from '@testing-library/react';
import {
  isBuyScreenOwningProviderPick,
  useBuyScreenOwnsProviderPick,
} from './providerPickCoordination';

describe('providerPickCoordination', () => {
  it('reports no owner while no Buy screen is mounted', () => {
    expect(isBuyScreenOwningProviderPick()).toBe(false);
  });

  it('reports an owner while a Buy screen is mounted', () => {
    const { unmount } = renderHook(() => useBuyScreenOwnsProviderPick());

    expect(isBuyScreenOwningProviderPick()).toBe(true);

    unmount();
  });

  it('releases ownership when the Buy screen unmounts', () => {
    const { unmount } = renderHook(() => useBuyScreenOwnsProviderPick());

    unmount();

    expect(isBuyScreenOwningProviderPick()).toBe(false);
  });

  it('keeps ownership until the last mounted Buy screen unmounts', () => {
    const first = renderHook(() => useBuyScreenOwnsProviderPick());
    const second = renderHook(() => useBuyScreenOwnsProviderPick());

    first.unmount();

    expect(isBuyScreenOwningProviderPick()).toBe(true);

    second.unmount();

    expect(isBuyScreenOwningProviderPick()).toBe(false);
  });
});
