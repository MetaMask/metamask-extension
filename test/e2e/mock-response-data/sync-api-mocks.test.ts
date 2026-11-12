import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  discoverApiResponses,
  listApiResponseFixtureIds,
  missingApiResponseSourceMessage,
} from './sync-api-mocks';

function responsesDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'api-responses-'));
}

function writeJson(dir: string, name: string, value: unknown) {
  writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
}

describe('api-responses discovery', () => {
  it('ignores a missing directory and the source manifest', () => {
    expect(
      listApiResponseFixtureIds(path.join(tmpdir(), 'missing-api-responses')),
    ).toStrictEqual([]);
    const dir = responsesDir();
    writeJson(dir, 'sources.json', {});
    writeJson(dir, 'gas-prices.json', { low: '' });
    expect(listApiResponseFixtureIds(dir)).toStrictEqual(['gas-prices']);
  });

  it('fails with the object to add when a fixture has no source entry', () => {
    const dir = responsesDir();
    writeJson(dir, 'gas-prices.json', {});
    const plan = discoverApiResponses(dir);
    expect(plan.rows).toStrictEqual([]);
    expect(plan.errors).toStrictEqual([
      missingApiResponseSourceMessage('gas-prices'),
    ]);
    expect(plan.errors[0]).toContain('api-responses/sources.json');
    expect(plan.errors[0]).toContain('"mode": "write"');
  });

  it('syncs a GET fixture from its declared url', () => {
    const dir = responsesDir();
    writeJson(dir, 'gas-prices.json', {});
    writeJson(dir, 'sources.json', {
      'gas-prices': {
        method: 'GET',
        url: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
        mode: 'write',
      },
    });
    expect(discoverApiResponses(dir)).toStrictEqual({
      errors: [],
      warnings: [],
      rows: [
        {
          id: 'gas-prices',
          url: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
          mode: 'write:api-responses/gas-prices.json',
        },
      ],
    });
  });

  it('warns for a skip entry and does not fetch it', () => {
    const dir = responsesDir();
    writeJson(dir, 'bridge-get-tokens-popular.json', {});
    writeJson(dir, 'sources.json', {
      'bridge-get-tokens-popular': {
        method: 'POST',
        url: 'https://bridge.api.cx.metamask.io/getTokens/popular',
        mode: 'skip',
        reason: 'POST with a request-specific body',
      },
    });
    const plan = discoverApiResponses(dir);
    expect(plan.errors).toStrictEqual([]);
    expect(plan.rows).toStrictEqual([]);
    expect(plan.warnings).toStrictEqual([
      'skip bridge-get-tokens-popular POST https://bridge.api.cx.metamask.io/getTokens/popular: POST with a request-specific body',
    ]);
  });

  it('rejects a skip entry with no reason and a non-GET write', () => {
    const dir = responsesDir();
    mkdirSync(dir, { recursive: true });
    writeJson(dir, 'needs-id.json', {});
    writeJson(dir, 'popular.json', {});
    writeJson(dir, 'sources.json', {
      'needs-id': {
        method: 'GET',
        url: 'https://example.test/status',
        mode: 'skip',
      },
      popular: {
        method: 'POST',
        url: 'https://example.test/popular',
        mode: 'write',
      },
    });
    const { errors, rows } = discoverApiResponses(dir);
    expect(rows).toStrictEqual([]);
    expect(errors.join('\n')).toContain('needs a "reason"');
    expect(errors.join('\n')).toContain('Set "mode" to "skip"');
  });
});
