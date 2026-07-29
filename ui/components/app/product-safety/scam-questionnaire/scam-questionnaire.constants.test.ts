import {
  Answers,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  getRedFlagCount,
  getRedFlagQuestions,
} from './scam-questionnaire.constants';

const noFlag = Q1_OPTIONS.find((o) => o.key === 'q1_no');
const redFlag = Q1_OPTIONS.find((o) => o.key === 'q1_yes');
const q2Clean = Q2_OPTIONS.find((o) => o.key === 'q2_goods');
const q3Flag = Q3_OPTIONS.find((o) => o.key === 'q3_yes');

describe('scam-questionnaire.constants', () => {
  describe('getRedFlagCount', () => {
    it('returns 0 when no answers are red flags', () => {
      const answers: Answers = { q1: noFlag, q2: q2Clean };
      expect(getRedFlagCount(answers)).toBe(0);
    });

    it('counts only the red-flag answers', () => {
      const answers: Answers = { q1: redFlag, q2: q2Clean, q3: q3Flag };
      expect(getRedFlagCount(answers)).toBe(2);
    });

    it('returns 0 for an empty answer set', () => {
      expect(getRedFlagCount({})).toBe(0);
    });
  });

  describe('getRedFlagQuestions', () => {
    it('returns the ids of the red-flag answers only', () => {
      const answers: Answers = { q1: redFlag, q2: q2Clean, q3: q3Flag };
      expect(getRedFlagQuestions(answers)).toStrictEqual(['q1', 'q3']);
    });

    it('returns an empty array when nothing is flagged', () => {
      expect(getRedFlagQuestions({ q1: noFlag })).toStrictEqual([]);
    });
  });
});
