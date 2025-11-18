import type { CoverageStatus } from '@metamask/shield-controller';
import { getCoverageStatus, ShieldState } from './coverage';

describe('shield coverage selectors', () => {
  const confirmationId = 'abc123';

  it('returns undefineds when there are no coverage results', () => {
    const state = {
      metamask: {
        coverageResults: {},
      },
    } as unknown as ShieldState;

    const result = getCoverageStatus(state, confirmationId);
    expect(result).toEqual({ status: undefined, reasonCode: undefined });
  });

  it('returns undefineds when results array is empty', () => {
    const state = {
      metamask: {
        coverageResults: {
          [confirmationId]: { results: [] },
        },
      },
    } as unknown as ShieldState;

    const result = getCoverageStatus(state, confirmationId);
    expect(result).toEqual({ status: undefined, reasonCode: undefined });
  });

  it('returns status and reasonCode from the first result', () => {
    const status: CoverageStatus = 'covered';
    const reasonCode = 'ok';
    const state = {
      metamask: {
        coverageResults: {
          [confirmationId]: {
            results: [
              {
                status,
                reasonCode,
              },
              { status: 'other', reasonCode: 'ignored' },
            ],
          },
        },
      },
    } as unknown as ShieldState;

    const result = getCoverageStatus(state, confirmationId);
    expect(result.status).toBe(status);
    expect(result.reasonCode).toBe(reasonCode);
  });
});
