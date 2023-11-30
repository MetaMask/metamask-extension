import { MetaMetricsParticipation } from '../../../shared/constants/metametrics';
import { migrate } from './106';

describe('migration #78', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: 105 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 106 });
  });

  it('should set `metaMetricsParticipationMode` to `NotChosen` if `participateInMetaMetrics` is `null`', async () => {
    const oldStorage = {
      meta: { version: 105 },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: null,
        },
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual({
      meta: { version: 106 },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.NotChosen,
        },
      },
    });
  });

  it('should set `metaMetricsParticipationMode` to `NotChosen` if `participateInMetaMetrics` is `undefined`', async () => {
    const oldStorage = {
      meta: { version: 105 },
      data: { MetaMetricsController: {} },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: 106 },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.NotChosen,
        },
      },
    });
  });

  it('should set `metaMetricsParticipationMode` to `DoNotParticipate` if `participateInMetaMetrics` is `false`', async () => {
    const oldStorage = {
      meta: { version: 105 },
      data: { MetaMetricsController: { participateInMetaMetrics: false } },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: 106 },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode:
            MetaMetricsParticipation.DoNotParticipate,
        },
      },
    });
  });

  it('should set `metaMetricsParticipationMode` to `Participate` if `participateInMetaMetrics` is `true`', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        MetaMetricsController: { participateInMetaMetrics: true },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.Participate,
        },
      },
    });
  });

  it('should not change `metaMetricsParticipationMode` if it is already set and `participateInMetaMetrics` is `true`', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsParticipationMode:
            MetaMetricsParticipation.DoNotParticipate,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode:
            MetaMetricsParticipation.DoNotParticipate,
        },
      },
    });
  });

  it('should not change `metaMetricsParticipationMode` if it is already set and `participateInMetaMetrics` is `false`', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: false,
          metaMetricsParticipationMode: MetaMetricsParticipation.Participate,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.Participate,
        },
      },
    });
  });

  it('should not change `metaMetricsParticipationMode` if it is already set and `participateInMetaMetrics` is `null`', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.Participate,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.Participate,
        },
      },
    });
  });

  it('should not alter any other data', async () => {
    const oldStorage = {
      meta: {
        version: 105,
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
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        MetaMetricsController: {
          metaMetricsParticipationMode: MetaMetricsParticipation.NotChosen,
          segmentApiCalls: { 1: ['test'] },
          fragments: { 1: ['test'] },
          metaMetricsId: '0x00',
        },
        SomeOtherController: { foo: 'bar' },
      },
    });
  });
});
