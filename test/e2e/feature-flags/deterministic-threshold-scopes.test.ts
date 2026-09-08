import type { Json } from '@metamask/utils';
import {
  selectDefaultThresholdEntry,
  toDeterministicThresholdScopes,
  type ThresholdEntry,
} from './deterministic-threshold-scopes';

function thresholdEntry(
  name: string,
  value: number,
  extra: Record<string, Json> = {},
): ThresholdEntry {
  return {
    name,
    scope: {
      type: 'threshold',
      value,
    },
    ...extra,
  };
}

function namedThresholdEntry(
  thresholdName: string,
  value: number,
  extra: Record<string, Json> = {},
): ThresholdEntry {
  return {
    thresholdName,
    thresholdVersion: 2,
    scope: {
      type: 'threshold',
      value,
    },
    ...extra,
  };
}

describe('selectDefaultThresholdEntry', () => {
  describe('when an entry is named control', () => {
    it('picks named control even when treatment already has value 1', () => {
      const control = thresholdEntry('control', 0.95);
      const treatment = thresholdEntry('treatment', 1);
      const selected = selectDefaultThresholdEntry([control, treatment]);

      expect(selected).toBe(control);
    });

    it('uses thresholdName control when name is absent', () => {
      const control = namedThresholdEntry('control', 0);
      const treatment = namedThresholdEntry('treatment', 1);
      const selected = selectDefaultThresholdEntry([treatment, control]);

      expect(selected).toBe(control);
    });

    it('matches control case-insensitively', () => {
      const control = thresholdEntry('Control', 0.1);
      const treatment = thresholdEntry('treatment', 1);
      const selected = selectDefaultThresholdEntry([treatment, control]);

      expect(selected).toBe(control);
    });
  });

  describe('when the array has one variant', () => {
    it('returns that item', () => {
      const only = thresholdEntry('feature is ON', 1);
      expect(selectDefaultThresholdEntry([only])).toBe(only);
    });
  });

  describe('when there is no control', () => {
    it('picks the widest bucket when ON is 0.9 and OFF is 1', () => {
      const on = thresholdEntry('feature is ON', 0.9);
      const off = thresholdEntry('feature is OFF', 1);
      const selected = selectDefaultThresholdEntry([on, off]);

      expect(selected).toBe(on);
    });

    it('picks the widest bucket when ON is 0.2 and OFF is 1', () => {
      const on = thresholdEntry('feature is ON', 0.2);
      const off = thresholdEntry('feature is OFF', 1);
      const selected = selectDefaultThresholdEntry([on, off]);

      expect(selected).toBe(off);
    });
  });

  describe('when the array is empty', () => {
    it('returns undefined', () => {
      expect(selectDefaultThresholdEntry([])).toBeUndefined();
    });
  });
});

describe('toDeterministicThresholdScopes', () => {
  describe('when the value is an A/B threshold array', () => {
    it('sets control to 1 and treatment to 0', () => {
      const input: Json = [
        thresholdEntry('control', 0.95),
        thresholdEntry('treatment', 1),
      ];

      expect(toDeterministicThresholdScopes(input)).toStrictEqual([
        thresholdEntry('control', 1),
        thresholdEntry('treatment', 0),
      ]);
    });

    it('preserves thresholdVersion 2 payloads when using thresholdName', () => {
      const input: Json = [
        namedThresholdEntry('control', 0.8, {
          value: { color: 'green' },
        }),
        namedThresholdEntry('treatment', 1, {
          value: { color: 'blue' },
        }),
      ];

      expect(toDeterministicThresholdScopes(input)).toStrictEqual([
        namedThresholdEntry('control', 1, {
          value: { color: 'green' },
        }),
        namedThresholdEntry('treatment', 0, {
          value: { color: 'blue' },
        }),
      ]);
    });
  });

  describe('when the value is version-scoped', () => {
    it('rewrites nested threshold arrays under versions', () => {
      const input: Json = {
        versions: {
          '13.39.0': [
            thresholdEntry('control', 0.5),
            thresholdEntry('treatment', 1),
          ],
        },
      };

      expect(toDeterministicThresholdScopes(input)).toStrictEqual({
        versions: {
          '13.39.0': [
            thresholdEntry('control', 1),
            thresholdEntry('treatment', 0),
          ],
        },
      });
    });
  });

  describe('when there is no control', () => {
    it('forces the widest bucket to 1', () => {
      const input: Json = [
        thresholdEntry('feature is ON', 0.9, { value: true }),
        thresholdEntry('feature is OFF', 1, { value: false }),
      ];

      expect(toDeterministicThresholdScopes(input)).toStrictEqual([
        thresholdEntry('feature is ON', 1, { value: true }),
        thresholdEntry('feature is OFF', 0, { value: false }),
      ]);
    });
  });

  describe('when the value is not a threshold array', () => {
    it('leaves an empty array unchanged', () => {
      expect(toDeterministicThresholdScopes([])).toStrictEqual([]);
    });

    it('leaves booleans unchanged', () => {
      expect(toDeterministicThresholdScopes(true)).toBe(true);
    });

    it('leaves unrelated arrays unchanged', () => {
      expect(toDeterministicThresholdScopes(['0x1', '0xe708'])).toStrictEqual([
        '0x1',
        '0xe708',
      ]);
    });
  });

  describe('when the value is already normalized', () => {
    it('is idempotent', () => {
      const input: Json = [
        thresholdEntry('control', 1),
        thresholdEntry('treatment', 0),
      ];

      expect(toDeterministicThresholdScopes(input)).toStrictEqual(input);
      expect(
        toDeterministicThresholdScopes(toDeterministicThresholdScopes(input)),
      ).toStrictEqual(input);
    });
  });

  describe('when rewriting', () => {
    it('does not mutate the input array or items', () => {
      const control = thresholdEntry('control', 0.95);
      const treatment = thresholdEntry('treatment', 1);
      const input = [control, treatment];

      toDeterministicThresholdScopes(input);

      expect(control.scope.value).toBe(0.95);
      expect(treatment.scope.value).toBe(1);
      expect(input).toHaveLength(2);
    });
  });
});
