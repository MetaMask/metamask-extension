import { act, renderHook } from '@testing-library/react';
import { endTrace, trace, TraceName } from '#shared/lib/trace';
import { useTrace } from './useTrace';

jest.mock('#shared/lib/trace', () => ({
  endTrace: jest.fn(),
  trace: jest.fn(),
  TraceName: {
    HomepageReady: 'Homepage Ready',
    HomepageSectionTimeToContent: 'Homepage Section Time To Content',
  },
}));

describe('useTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts and ends a trace when it becomes ready', () => {
    const { rerender } = renderHook(
      ({ ready }) =>
        useTrace({
          name: TraceName.HomepageSectionTimeToContent,
          op: 'test.operation',
          generationKey: 'first',
          ready,
          data: { success: true },
        }),
      { initialProps: { ready: false } },
    );

    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageSectionTimeToContent,
        op: 'test.operation',
      }),
    );
    expect(endTrace).not.toHaveBeenCalled();

    rerender({ ready: true });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageSectionTimeToContent,
        data: { success: true },
      }),
    );
  });

  it('converts data keys to snake case', () => {
    const sectionIdKey = 'section_id';
    const contentStateKey = 'content_state';
    const { rerender } = renderHook(
      ({ ready }) =>
        useTrace({
          name: TraceName.HomepageSectionTimeToContent,
          ready,
          data: { sectionId: 'balance', contentState: 'filled' },
        }),
      { initialProps: { ready: false } },
    );

    rerender({ ready: true });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          [sectionIdKey]: 'balance',
          [contentStateKey]: 'filled',
        },
      }),
    );
  });

  it('calls onEnd after ending a ready trace', () => {
    const onEnd = jest.fn();
    const { rerender } = renderHook(
      ({ ready }) =>
        useTrace({
          name: TraceName.HomepageSectionTimeToContent,
          ready,
          onEnd,
        }),
      { initialProps: { ready: false } },
    );

    rerender({ ready: true });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('constructs the parent context for the wrapper', () => {
    const parentNameKey = '_name';
    const parentIdKey = '_id';

    renderHook(() =>
      useTrace({
        name: TraceName.HomepageSectionTimeToContent,
        id: 'section-id',
        parentName: TraceName.HomepageReady,
        parentId: 'homepage-id',
      }),
    );

    expect(trace).toHaveBeenCalledWith({
      name: TraceName.HomepageSectionTimeToContent,
      id: 'section-id',
      op: undefined,
      parentContext: {
        [parentNameKey]: TraceName.HomepageReady,
        [parentIdKey]: 'homepage-id',
      },
    });
  });

  it('ends a restarted trace when its parent changes while ready', () => {
    const { rerender } = renderHook(
      ({ parentId }) =>
        useTrace({
          name: TraceName.HomepageSectionTimeToContent,
          parentName: TraceName.HomepageReady,
          parentId,
          ready: true,
        }),
      { initialProps: { parentId: 'first-parent' } },
    );

    rerender({ parentId: 'second-parent' });

    expect(trace).toHaveBeenCalledTimes(2);
    expect(endTrace).toHaveBeenCalledTimes(2);
  });

  it('defers an end until child traces start', async () => {
    const parentId = 'homepage-id';
    const mockedTrace = jest.mocked(trace);
    const mockedEndTrace = jest.mocked(endTrace);

    renderHook(() => {
      useTrace({
        name: TraceName.HomepageReady,
        id: parentId,
        ready: true,
        deferEnd: true,
      });
      useTrace({
        name: TraceName.HomepageSectionTimeToContent,
        parentName: TraceName.HomepageReady,
        parentId,
      });
    });

    const childStartOrder = mockedTrace.mock.invocationCallOrder[1];

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    const parentEndOrder = mockedEndTrace.mock.invocationCallOrder.find(
      (_, index) => mockedEndTrace.mock.calls[index][0].id === parentId,
    );

    expect(childStartOrder).toBeLessThan(parentEndOrder ?? Infinity);
  });

  it('ends an unfinished trace on unmount', () => {
    const { unmount } = renderHook(() =>
      useTrace({ name: TraceName.HomepageSectionTimeToContent }),
    );

    unmount();

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageSectionTimeToContent,
        data: { success: false, reason: 'unmounted' },
      }),
    );
  });

  it('starts a new trace when the generation changes', () => {
    const { rerender } = renderHook(
      ({ generationKey }) =>
        useTrace({
          name: TraceName.HomepageSectionTimeToContent,
          generationKey,
        }),
      { initialProps: { generationKey: 'first' } },
    );

    rerender({ generationKey: 'second' });

    expect(trace).toHaveBeenCalledTimes(2);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { success: false, reason: 'superseded' },
      }),
    );
  });
});
