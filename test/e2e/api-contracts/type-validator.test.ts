/** @jest-environment node */
import { createConsumerTypeValidator } from './type-validator';
import type { ConsumerTypeValidator } from './type-validator';

const TYPE_RESOLUTION_TIMEOUT_MS = 60_000;

describe('createConsumerTypeValidator', () => {
  let validator: ConsumerTypeValidator;

  beforeAll(() => {
    validator = createConsumerTypeValidator();
  }, TYPE_RESOLUTION_TIMEOUT_MS);

  it('throws for a type that is not declared in ApiConsumerTypes', () => {
    expect(() => validator.validate('NotAConsumerType', {})).toThrow(
      'Unknown consumer type "NotAConsumerType"',
    );
  });

  it('accepts extra properties the consumer type does not declare', () => {
    expect(
      validator.validate('priceApiV2SupportedNetworks', {
        fullSupport: ['eip155:1'],
        partialSupport: { spotPricesV2: [], spotPricesV3: [] },
        newField: true,
      }),
    ).toStrictEqual([]);
  });

  // Payloads below are the ones that crashed the wallet in production.
  describe('incident payloads', () => {
    it('reports a non-string Contentful banner headline (#43953)', () => {
      expect(
        validator.validate('contentfulPromotionalBanners', {
          items: [
            {
              sys: { id: 'evilbanner1' },
              fields: {
                headline: { x: 'not-a-string' },
                teaser: 'Check out this feature',
                image: { sys: { id: 'img1' } },
                linkUrl: 'https://metamask.io',
                undismissable: false,
                showInExtension: true,
              },
            },
          ],
          includes: {
            Asset: [
              {
                sys: { id: 'img1' },
                fields: { file: { url: '//images.ctfassets.net/x/b.png' } },
              },
            ],
          },
        }),
      ).toStrictEqual([
        {
          path: '$.items[0].fields.headline',
          message: 'expected string, received object {"x":"not-a-string"}',
        },
      ]);
    });

    it('reports a platform notification without a template (#44088)', () => {
      const mismatches = validator.validate('notificationApiV4List', [
        {
          id: 'poison-1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          notification_type: 'platform',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          created_at: '2026-07-02T00:00:00.000Z',
          unread: true,
        },
      ]);

      expect(mismatches.map(({ path }) => path)).toContain('$[0].template');
    });

    it('reports a DeFi protocol token without balanceRaw (#44091)', () => {
      const mismatches = validator.validate('defiAdaptersPositions', {
        data: [
          {
            success: true,
            chainId: 1,
            protocolId: 'evilproto',
            productId: 'evil',
            name: 'Evil',
            description: 'Evil protocol',
            siteUrl: 'https://example.com',
            chainName: 'ethereum',
            protocolDisplayName: 'Evil Protocol',
            iconUrl: 'https://example.com/icon.png',
            positionType: 'supply',
            tokens: [
              {
                type: 'protocol',
                address: '0x1111111111111111111111111111111111111111',
                symbol: 'EVL',
                name: 'Evil Token',
                balance: 1,
                price: 1,
                decimals: 18,
              },
            ],
          },
        ],
      });

      expect(mismatches).toStrictEqual([
        {
          path: '$.data[0].tokens[0].balanceRaw',
          message: 'missing required property (expected string)',
        },
      ]);
    });

    it('reports a ramps response that is not an array (#44089)', () => {
      expect(
        validator.validate('rampsRegionsCountries', {
          networks: 'not-an-array',
        }),
      ).toStrictEqual([
        {
          path: '$',
          message:
            'expected Country[], received object {"networks":"not-an-array"}',
        },
      ]);
    });

    it('reports a null spot price (#44087)', () => {
      const mismatches = validator.validate('priceApiV3SpotPrices', {
        'eip155:1/slip44:60': { price: null },
      });

      expect(mismatches).toContainEqual({
        path: '$["eip155:1/slip44:60"].price',
        message: 'expected number, received null',
      });
    });
  });

  it('reports the variant a discriminated union value claims to be', () => {
    const mismatches = validator.validate('defiAdaptersPositions', {
      data: [{ success: true, chainId: 1 }],
    });

    expect(mismatches.map(({ path }) => path)).toContain('$.data[0].tokens');
    expect(mismatches.map(({ path }) => path)).not.toContain('$.data[0].error');
  });

  it('reports items of an optional array property rather than the whole array', () => {
    const mismatches = validator.validate('rampsRegionsCountries', [
      {
        isoCode: 'US',
        flag: '🇺🇸',
        name: 'United States',
        phone: { prefix: '+1', placeholder: '', template: '' },
        currency: 'USD',
        supported: { buy: true, sell: true },
        states: [{ id: 'us-al', supported: true }],
      },
    ]);

    expect(mismatches).toStrictEqual([
      {
        path: '$[0].states[0].supported',
        message: 'expected SupportedActions | undefined, received boolean true',
      },
    ]);
  });
});
