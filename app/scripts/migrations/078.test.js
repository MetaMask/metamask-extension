import { METAMETRICS_PARTICIPATION } from '../../../shared/constants/metametrics';
import migration78 from './078';

describe('migration #78', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 78,
    });
  });
  it('should set metaMetricsParticipationMode to NOT_CHOSEN if participateInMetaMetrics is null', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: null,
        },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.NOT_CHOSEN,
        },
      },
    });
  });

  it('should set metaMetricsParticipationMode to NOT_CHOSEN if participateInMetaMetrics is undefined', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        MetaMetricsController: {},
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.NOT_CHOSEN,
        },
      },
    });
  });

  it('should set metaMetricsParticipationMode to DO_NOT_PARTICIPATE if participateInMetaMetrics is false', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        MetaMetricsController: { participateInMetaMetrics: false },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode:
            METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE,
        },
      },
    });
  });

  it('should set metaMetricsParticipationMode to PARTICIPATE if participateInMetaMetrics is true', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        MetaMetricsController: { participateInMetaMetrics: true },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.PARTICIPATE,
        },
      },
    });
  });

  it('should not alter any other data', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        MetaMetricsController: {
          segmentApiCalls: { 1: ['test'] },
          fragments: { 1: ['test'] },
          metaMetricsId: '0x00',
        },
        SomeOtherController: { foo: 'bar' },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.NOT_CHOSEN,
          segmentApiCalls: { 1: ['test'] },
          fragments: { 1: ['test'] },
          metaMetricsId: '0x00',
        },
        SomeOtherController: { foo: 'bar' },
      },
    });
  });
});
