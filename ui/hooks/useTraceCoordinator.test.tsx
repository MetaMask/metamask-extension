import React from 'react';
import { render } from '@testing-library/react';
import { endTrace, trace, TraceName } from '#shared/lib/trace';
import { TraceCoordinator, useCoordinatedTrace } from './useTraceCoordinator';

jest.mock('#shared/lib/trace', () => ({
  endTrace: jest.fn(),
  trace: jest.fn(),
  TraceName: {
    HomepageReady: 'Homepage Ready',
    HomepageSectionTimeToContent: 'Homepage Section Time To Content',
  },
}));

const TraceReporter = ({
  ready,
  sectionId,
}: {
  ready: boolean;
  sectionId: string;
}) => {
  useCoordinatedTrace({
    name: TraceName.HomepageSectionTimeToContent,
    op: 'test.operation',
    ready,
    sectionId,
    data: { success: true },
  });

  return null;
};

describe('TraceCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts the parent before children and ends it after every child is ready', () => {
    const parentNameKey = '_name';
    const parentIdKey = '_id';
    const mockedTrace = jest.mocked(trace);
    const { rerender } = render(
      <TraceCoordinator
        name={TraceName.HomepageReady}
        op="test.operation"
        parentId="homepage-id"
        requiredSignals={['balance', 'tokens']}
      >
        <TraceReporter ready={false} sectionId="balance" />
        <TraceReporter ready={false} sectionId="tokens" />
      </TraceCoordinator>,
    );

    expect(mockedTrace.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: 'homepage-id',
        name: TraceName.HomepageReady,
      }),
    );
    const childTraceCalls = mockedTrace.mock.calls.slice(1);

    expect(childTraceCalls).toHaveLength(2);
    childTraceCalls.forEach(([request]) => {
      expect(request).toEqual(
        expect.objectContaining({
          parentContext: {
            [parentNameKey]: TraceName.HomepageReady,
            [parentIdKey]: 'homepage-id',
          },
        }),
      );
    });

    expect(endTrace).not.toHaveBeenCalled();

    rerender(
      <TraceCoordinator
        name={TraceName.HomepageReady}
        op="test.operation"
        parentId="homepage-id"
        requiredSignals={['balance', 'tokens']}
      >
        <TraceReporter ready sectionId="balance" />
        <TraceReporter ready sectionId="tokens" />
      </TraceCoordinator>,
    );

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'homepage-id',
        name: TraceName.HomepageReady,
      }),
    );
  });
});
