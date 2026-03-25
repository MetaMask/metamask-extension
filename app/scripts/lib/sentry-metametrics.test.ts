import type { Client, Event as SentryEvent, EventHint } from '@sentry/types';

import type { MetaMetricsParticipation } from './sentry-get-state';
import { metaMetricsIntegration } from './sentry-metametrics';

const stubHint = {} as EventHint;
const stubClient = {} as Client;

describe('metaMetricsIntegration', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockClear();
  });

  function createIntegration(
    getMetaMetricsState: () => Promise<MetaMetricsParticipation>,
  ) {
    return metaMetricsIntegration({
      getMetaMetricsState,
      log,
    });
  }

  describe('processEvent', () => {
    it('returns null and logs when MetaMetrics is disabled', async () => {
      const integration = createIntegration(async () => ({
        participateInMetaMetrics: false,
      }));
      const event: SentryEvent = { message: 'err' };
      const { processEvent } = integration;
      if (!processEvent) {
        throw new Error('expected processEvent');
      }
      await expect(
        processEvent(event, stubHint, stubClient),
      ).resolves.toBeNull();
      expect(log).toHaveBeenCalledWith('Event dropped as metrics disabled');
    });

    it('returns null when MetaMetrics state is null', async () => {
      const integration = createIntegration(async () => null);
      const event: SentryEvent = { message: 'err' };
      const { processEvent } = integration;
      if (!processEvent) {
        throw new Error('expected processEvent');
      }
      await expect(
        processEvent(event, stubHint, stubClient),
      ).resolves.toBeNull();
      expect(log).toHaveBeenCalledWith('Event dropped as metrics disabled');
    });

    it('attaches user.id from getMetaMetricsState when opted in', async () => {
      const integration = createIntegration(async () => ({
        participateInMetaMetrics: true,
        metaMetricsId: 'metrics-id-from-async',
      }));
      const event: SentryEvent = { message: 'err' };
      const { processEvent } = integration;
      if (!processEvent) {
        throw new Error('expected processEvent');
      }
      const result = await processEvent(event, stubHint, stubClient);
      expect(result).toBe(event);
      expect(event.user).toStrictEqual({ id: 'metrics-id-from-async' });
      expect(log).not.toHaveBeenCalled();
    });

    it('does not set user when opted in but metaMetricsId is missing', async () => {
      const integration = createIntegration(async () => ({
        participateInMetaMetrics: true,
        metaMetricsId: undefined,
      }));
      const event: SentryEvent = { message: 'err' };
      const { processEvent } = integration;
      if (!processEvent) {
        throw new Error('expected processEvent');
      }
      await processEvent(event, stubHint, stubClient);
      expect(event.user).toBeUndefined();
    });
  });
});
