import { ErrorReportingService } from '@metamask/error-reporting-service';
import { captureException } from '../../../shared/lib/sentry';
import { ControllerInitFunction } from './types';
import { ErrorReportingServiceMessenger } from './messengers';

/**
 * Initialize the error reporting service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const ErrorReportingServiceInit: ControllerInitFunction<
  ErrorReportingService,
  ErrorReportingServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new ErrorReportingService({
    messenger: controllerMessenger,
    captureException,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
