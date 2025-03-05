import { renderHook, act } from '@testing-library/react-hooks';
import * as traceModule from '../../../../shared/lib/trace';
import {
  useSamplePerformanceTrace,
  TraceHandlers,
} from './useSamplePerformanceTrace';

// Mock the trace module
jest.mock('../../../../shared/lib/trace', () => {
  const original = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...original,
    trace: jest.fn(() => 'mock-trace-context'),
    endTrace: jest.fn(),
    TraceName: {
      ...original.TraceName,
      Transaction: 'Transaction',
      DeveloperTest: 'Developer Test',
    },
  };
});

describe('useSamplePerformanceTrace', () => {
  // Test data
  const defaultProps = {
    componentName: 'TestComponent',
    featureId: 'test-feature',
  };

  // Test helpers
  const setupHook = (props = defaultProps) => {
    return renderHook(() => useSamplePerformanceTrace(props));
  };

  const setupFormSubmissionTrace = () => {
    const { result } = setupHook();
    let formSubmissionTrace = {} as TraceHandlers;

    act(() => {
      formSubmissionTrace = result.current.traceFormSubmission();
    });

    jest.clearAllMocks();

    return { result, formSubmissionTrace };
  };

  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return a traceFormSubmission function', () => {
      const { result } = setupHook();

      expect(result.current).toHaveProperty('traceFormSubmission');
      expect(typeof result.current.traceFormSubmission).toBe('function');
    });

    it('should ensure traceFormSubmission is memoized with componentName dependency', () => {
      const { result, rerender } = setupHook();
      const initialTraceFormSubmission = result.current.traceFormSubmission;

      // Rerender with the same props
      rerender();

      // function reference should be the same (memoized)
      expect(result.current.traceFormSubmission).toBe(
        initialTraceFormSubmission,
      );

      // Render with different featureId but same componentName
      // (componentName is the only dependency in useCallback)
      rerender({ ...defaultProps, featureId: 'different-feature' });

      // Function reference should still be the same
      expect(result.current.traceFormSubmission).toBe(
        initialTraceFormSubmission,
      );
    });
  });

  describe('Component lifecycle tracing', () => {
    it('should start component trace on mount with correct parameters', () => {
      setupHook();

      expect(traceModule.trace).toHaveBeenCalledTimes(1);
      expect(traceModule.trace).toHaveBeenCalledWith({
        name: traceModule.TraceName.DeveloperTest,
        data: {
          component: defaultProps.componentName,
          featureId: defaultProps.featureId,
        },
      });
    });

    it('should use customized component name and featureId when provided', () => {
      const customProps = {
        componentName: 'CustomComponent',
        featureId: 'custom-feature',
      };

      setupHook(customProps);

      expect(traceModule.trace).toHaveBeenCalledWith({
        name: traceModule.TraceName.DeveloperTest,
        data: {
          component: customProps.componentName,
          featureId: customProps.featureId,
        },
      });
    });

    it('should end component trace on unmount with correct parameters', () => {
      const { unmount } = setupHook();
      jest.clearAllMocks();

      unmount();

      expect(traceModule.endTrace).toHaveBeenCalledTimes(1);
      expect(traceModule.endTrace).toHaveBeenCalledWith({
        name: traceModule.TraceName.DeveloperTest,
      });
    });
  });

  describe('traceFormSubmission function', () => {
    describe('returned handlers', () => {
      it('should return an object with startTrace and endTrace functions', () => {
        const { result } = setupHook();
        const handlers = result.current.traceFormSubmission();

        expect(handlers).toHaveProperty('startTrace');
        expect(handlers).toHaveProperty('endTrace');
        expect(typeof handlers.startTrace).toBe('function');
        expect(typeof handlers.endTrace).toBe('function');
      });
    });

    describe('trace id generation', () => {
      // Setup a fixed timestamp for deterministic testing
      const FIXED_TIMESTAMP = 12345;
      let originalDateNow: () => number;

      beforeEach(() => {
        originalDateNow = Date.now;
        Date.now = jest.fn(() => FIXED_TIMESTAMP);
      });

      afterEach(() => {
        Date.now = originalDateNow;
      });

      it('should generate a traceId with form-submission prefix and timestamp', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();

        act(() => {
          formSubmissionTrace.startTrace();
        });

        expect(traceModule.trace).toHaveBeenCalledWith(
          expect.objectContaining({
            id: `form-submission-${FIXED_TIMESTAMP}`,
          }),
        );
      });
    });

    describe('startTrace function', () => {
      it('should call trace with correct parameters', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();

        let traceContext;
        act(() => {
          traceContext = formSubmissionTrace.startTrace();
        });

        expect(traceModule.trace).toHaveBeenCalledTimes(1);
        expect(traceModule.trace).toHaveBeenCalledWith(
          expect.objectContaining({
            name: traceModule.TraceName.Transaction,
            data: expect.objectContaining({
              operation: 'formSubmission',
              component: defaultProps.componentName,
            }),
          }),
        );
        expect(traceContext).toBe('mock-trace-context');
      });
    });

    describe('endTrace function', () => {
      beforeEach(() => {
        // Setup a fixed timestamp for deterministic testing
        jest.spyOn(Date, 'now').mockReturnValue(12345);
      });

      it('should call endTrace with correct parameters on success', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();
        const extraData = { extraData: 'test' };

        act(() => {
          formSubmissionTrace.startTrace();
        });

        act(() => {
          formSubmissionTrace.endTrace(true, extraData);
        });

        // check that endTrace was called correctly
        expect(traceModule.endTrace).toHaveBeenCalledTimes(1);
        expect(traceModule.endTrace).toHaveBeenCalledWith({
          name: traceModule.TraceName.Transaction,
          id: 'form-submission-12345',
        });
      });

      it('should log metadata on success with console.debug', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();
        const extraData = { extraData: 'test' };

        act(() => {
          formSubmissionTrace.startTrace();
        });

        act(() => {
          formSubmissionTrace.endTrace(true, extraData);
        });

        // check that console.debug was called with correct metadata
        expect(console.debug).toHaveBeenCalledTimes(1);
        expect(console.debug).toHaveBeenCalledWith(
          '[FormSubmission] Complete:',
          expect.objectContaining({
            success: true,
            extraData: 'test',
          }),
        );
      });

      it('should log metadata on failure with console.debug', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();
        const errorData = { reason: 'validation_error' };

        act(() => {
          formSubmissionTrace.startTrace();
        });

        act(() => {
          formSubmissionTrace.endTrace(false, errorData);
        });

        // check that console.debug was called with correct metadata
        expect(console.debug).toHaveBeenCalledWith(
          '[FormSubmission] Complete:',
          expect.objectContaining({
            success: false,
            reason: 'validation_error',
          }),
        );
      });

      it('should handle form submission without additional metadata', () => {
        const { formSubmissionTrace } = setupFormSubmissionTrace();

        act(() => {
          formSubmissionTrace.startTrace();
        });

        act(() => {
          formSubmissionTrace.endTrace(true);
        });

        expect(console.debug).toHaveBeenCalledWith(
          '[FormSubmission] Complete:',
          expect.objectContaining({
            success: true,
          }),
        );

        expect(console.debug).not.toHaveBeenCalledWith(
          '[FormSubmission] Complete:',
          expect.objectContaining({
            extraData: expect.anything(),
          }),
        );
      });
    });
  });
});
