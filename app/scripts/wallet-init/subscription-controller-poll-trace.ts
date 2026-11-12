import { traceBackgroundPoll } from '../../../shared/lib/trace';

type ControllerWithExecutePoll = {
  _executePoll?: (input: unknown) => Promise<void>;
};

/**
 * Run each timer-driven `SubscriptionController` poll cycle as its own trace.
 *
 * @param controller - The wallet's `SubscriptionController` instance.
 */
export function traceSubscriptionControllerPolls(controller: object): void {
  // The cast and `?.` skip type checks, so an upstream rename silently drops
  // this wrap; the test pins the method name on the real class.
  const pollingController = controller as ControllerWithExecutePoll;
  const executePoll = pollingController._executePoll?.bind(controller);

  if (executePoll) {
    pollingController._executePoll = (pollingInput: unknown) =>
      traceBackgroundPoll('SubscriptionController', () =>
        executePoll(pollingInput),
      );
  }
}
