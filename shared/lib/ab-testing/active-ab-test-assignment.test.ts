import {
  createActiveABTestAssignment,
  normalizeActiveABTestAssignments,
} from './active-ab-test-assignment';

describe('active-ab-test-assignment', () => {
  describe('createActiveABTestAssignment', () => {
    it('creates an assignment with a derived key_value_pair', () => {
      expect(
        createActiveABTestAssignment(
          'testTEST338AbtestAttentionBadge',
          'withBadge',
        ),
      ).toStrictEqual({
        key: 'testTEST338AbtestAttentionBadge',
        value: 'withBadge',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        key_value_pair: 'testTEST338AbtestAttentionBadge=withBadge',
      });
    });
  });

  describe('normalizeActiveABTestAssignments', () => {
    it('normalizes legacy assignments missing key_value_pair', () => {
      expect(
        normalizeActiveABTestAssignments([
          {
            key: 'testTEST338AbtestAttentionBadge',
            value: 'withBadge',
          },
        ]),
      ).toStrictEqual([
        createActiveABTestAssignment(
          'testTEST338AbtestAttentionBadge',
          'withBadge',
        ),
      ]);
    });

    it('recomputes stale key_value_pair values', () => {
      expect(
        normalizeActiveABTestAssignments([
          {
            key: 'testTEST338AbtestAttentionBadge',
            value: 'withBadge',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_value_pair: 'incorrect=value',
          },
        ]),
      ).toStrictEqual([
        createActiveABTestAssignment(
          'testTEST338AbtestAttentionBadge',
          'withBadge',
        ),
      ]);
    });

    it('discards malformed assignments', () => {
      expect(
        normalizeActiveABTestAssignments([
          null,
          { key: 'missing-value' },
          { value: 'missing-key' },
          { key: 'numeric-value', value: 1 },
          createActiveABTestAssignment('testTEST1000AbtestValid', 'control'),
        ]),
      ).toStrictEqual([
        createActiveABTestAssignment('testTEST1000AbtestValid', 'control'),
      ]);
    });

    it('returns an empty array for non-array values', () => {
      expect(normalizeActiveABTestAssignments(undefined)).toStrictEqual([]);
      expect(normalizeActiveABTestAssignments({})).toStrictEqual([]);
    });
  });
});
