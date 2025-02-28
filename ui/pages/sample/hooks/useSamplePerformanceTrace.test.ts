import { renderHook, act } from '@testing-library/react-hooks';
import * as traceModule from '../../../../shared/lib/trace';
import { TraceContext } from '../../../../shared/lib/trace';
import {
  useSamplePerformanceTrace,
  TraceHandlers,
} from './useSamplePerformanceTrace';

// Create mocks for the trace functions
jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  trace: jest.fn(() => 'mock-trace-context'),
  endTrace: jest.fn(),
  TraceName: {
    Transaction: 'Transaction',
    DeveloperTest: 'Developer Test',
  },
}));

describe('useSamplePerformanceTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start component trace on mount', () => {
    const { result } = renderHook(() =>
      useSamplePerformanceTrace({
        componentName: 'TestComponent',
        featureId: 'test-feature',
      }),
    );

    // Check that trace was called for component mount
    expect(traceModule.trace).toHaveBeenCalledWith({
      name: traceModule.TraceName.DeveloperTest,
      data: {
        component: 'TestComponent',
        featureId: 'test-feature',
      },
    });
  });

  it('should end component trace on unmount', () => {
    const { unmount } = renderHook(() =>
      useSamplePerformanceTrace({
        componentName: 'TestComponent',
        featureId: 'test-feature',
      }),
    );

    // Clear mocks to isolate the unmount call
    jest.clearAllMocks();

    unmount();

    // Check that endTrace was called
    expect(traceModule.endTrace).toHaveBeenCalledWith({
      name: traceModule.TraceName.DeveloperTest,
    });
  });

  it('should return traceFormSubmission function', () => {
    const { result } = renderHook(() =>
      useSamplePerformanceTrace({
        componentName: 'TestComponent',
        featureId: 'test-feature',
      }),
    );

    // Verify function is returned
    expect(typeof result.current.traceFormSubmission).toBe('function');
  });

  describe('traceFormSubmission', () => {
    it('should start and end a trace for form submission', () => {
      const { result } = renderHook(() =>
        useSamplePerformanceTrace({
          componentName: 'TestComponent',
          featureId: 'test-feature',
        }),
      );

      // Create the trace handlers
      let formSubmissionTrace: TraceHandlers;
      act(() => {
        formSubmissionTrace = result.current.traceFormSubmission();
      });

      // Clear mocks to isolate the function calls for the form submission trace
      jest.clearAllMocks();

      // Start the trace
      let traceContext: TraceContext;
      act(() => {
        traceContext = formSubmissionTrace.startTrace();
      });

      // Verify trace was called with the right parameters
      expect(traceModule.trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: traceModule.TraceName.Transaction,
          id: expect.any(String),
          data: expect.objectContaining({
            operation: 'formSubmission',
            component: 'TestComponent',
          }),
        }),
      );

      // End the trace
      act(() => {
        formSubmissionTrace.endTrace(true, { extraData: 'test' });
      });

      // Verify endTrace was called
      expect(traceModule.endTrace).toHaveBeenCalledWith({
        name: traceModule.TraceName.Transaction,
        id: expect.any(String),
      });
    });

    it('should pass the success flag to endTrace when form submission fails', () => {
      const { result } = renderHook(() =>
        useSamplePerformanceTrace({
          componentName: 'TestComponent',
          featureId: 'test-feature',
        }),
      );

      // Get the function and create the trace handlers
      let formSubmissionTrace: TraceHandlers;
      act(() => {
        formSubmissionTrace = result.current.traceFormSubmission();
      });

      // Clear mocks to isolate the function calls
      jest.clearAllMocks();

      // Mock console.debug to check metadata logging
      const originalConsoleDebug = console.debug;
      console.debug = jest.fn();

      // Start trace
      act(() => {
        formSubmissionTrace.startTrace();
      });

      // End trace with failure
      act(() => {
        formSubmissionTrace.endTrace(false, { reason: 'validation_error' });
      });

      // Verify console.debug was called with the right metadata
      expect(console.debug).toHaveBeenCalledWith(
        '[FormSubmission] Complete:',
        expect.objectContaining({
          success: false,
          reason: 'validation_error',
        }),
      );

      // Restore console.debug
      console.debug = originalConsoleDebug;
    });
  });
});
