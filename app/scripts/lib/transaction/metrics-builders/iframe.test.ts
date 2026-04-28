/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { getIframeMetricsProperties } from './iframe';
import { createBuilderRequest } from './test-utils';

describe('iframe builder', () => {
  it('builds iframe properties for cross-origin iframe transactions', () => {
    const result = getIframeMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          origin: 'https://iframe.example',
          mainFrameOrigin: 'https://top-level.example',
          frameId: 1,
        } as any,
      }),
    );

    expect(result.properties).toStrictEqual({
      is_iframe: true,
      is_cross_origin_iframe: true,
      iframe_origin: 'https://iframe.example',
      top_level_origin: 'https://top-level.example',
    });
  });

  it('builds top-level frame properties for non-iframe transactions', () => {
    const result = getIframeMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          origin: 'https://dapp.example',
          mainFrameOrigin: 'https://dapp.example',
          frameId: 0,
        } as any,
      }),
    );

    expect(result.properties).toStrictEqual({
      is_iframe: false,
      is_cross_origin_iframe: false,
      iframe_origin: null,
      top_level_origin: null,
    });
  });
});
