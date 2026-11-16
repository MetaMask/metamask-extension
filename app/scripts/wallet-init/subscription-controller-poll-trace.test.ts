import { SubscriptionController } from '@metamask/subscription-controller';
import { traceBackgroundPoll } from '../../../shared/lib/trace';
import { traceSubscriptionControllerPolls } from './subscription-controller-poll-trace';

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  traceBackgroundPoll: jest.fn((_controllerName: string, fn: () => unknown) =>
    fn(),
  ),
}));

describe('traceSubscriptionControllerPolls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('still names the polling hook on the real SubscriptionController', () => {
    expect(typeof SubscriptionController.prototype._executePoll).toBe(
      'function',
    );
  });

  it('runs each poll cycle inside a SubscriptionController background poll', async () => {
    const originalExecutePoll = jest.fn().mockResolvedValue(undefined);
    const controller = { _executePoll: originalExecutePoll };

    traceSubscriptionControllerPolls(controller);
    await controller._executePoll('input');

    expect(traceBackgroundPoll).toHaveBeenCalledTimes(1);
    expect(traceBackgroundPoll).toHaveBeenCalledWith(
      'SubscriptionController',
      expect.any(Function),
    );
    expect(originalExecutePoll).toHaveBeenCalledWith('input');
  });

  it("keeps the controller as the poll cycle's this", async () => {
    const controller = {
      seen: undefined as unknown,
      async _executePoll(this: { seen: unknown }) {
        this.seen = this;
      },
    };

    traceSubscriptionControllerPolls(controller);
    await controller._executePoll();

    expect(controller.seen).toBe(controller);
  });

  it('leaves a controller without a poll hook untouched', () => {
    const controller = {};

    traceSubscriptionControllerPolls(controller);

    expect(controller).toStrictEqual({});
  });
});
