import { useEffect, useCallback } from 'react';
import {
  trace,
  endTrace,
  TraceName,
  TraceContext,
} from '../../../../shared/lib/trace';

/**
 * Interface defining the trace handlers returned by traceFormSubmission
 */
export type TraceHandlers = {
  startTrace: () => TraceContext;
  endTrace: (success: boolean, metadata?: Record<string, unknown>) => void;
};

/**
 * Custom hook for performance tracing in the Sample Feature
 *
 * @param options - Configuration options for the trace
 * @param options.componentName - Name of the component being traced
 * @param options.featureId - ID of the feature being traced
 * @returns Object containing trace-related utility functions
 */
export function useSamplePerformanceTrace({
  componentName,
  featureId,
}: {
  componentName: string;
  featureId: string;
}) {
  // Start the main component trace when it mounts
  useEffect(() => {
    // Create a trace context for the entire component lifecycle
    trace({
      name: TraceName.DeveloperTest,
      data: {
        component: componentName,
        featureId,
      },
    });

    // End the component trace when component unmounts
    return () => {
      endTrace({
        name: TraceName.DeveloperTest,
      });
    };
  }, [componentName, featureId]);

  /**
   * Trace a form submission operation
   *
   * This function creates and returns functions to trace the
   * beginning and end of a form submission.
   *
   * @returns An object with functions to start and end a form submission trace
   */
  const traceFormSubmission = useCallback((): TraceHandlers => {
    const traceId = `form-submission-${Date.now()}`;

    const startTrace = () => {
      return trace({
        name: TraceName.Transaction,
        id: traceId,
        data: {
          operation: 'formSubmission',
          component: componentName,
        },
      });
    };

    const endTraceSubmission = (
      success: boolean,
      metadata?: Record<string, unknown>,
    ) => {
      // Combine the success flag and metadata into the timestamp parameter
      // since the real trace module doesn't have these parameters
      const combinedMetadata = {
        success,
        ...metadata,
      };

      // Log the metadata for debugging
      console.debug('[FormSubmission] Complete:', combinedMetadata);

      endTrace({
        name: TraceName.Transaction,
        id: traceId,
      });
    };

    return {
      startTrace,
      endTrace: endTraceSubmission,
    };
  }, [componentName]);

  return {
    traceFormSubmission,
  };
}
