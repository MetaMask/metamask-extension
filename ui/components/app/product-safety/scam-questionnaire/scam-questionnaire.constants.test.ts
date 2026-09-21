/* eslint-disable @typescript-eslint/naming-convention */
import {
  Answers,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  getAnswerRecord,
  getRedFlagCount,
  getRedFlagQuestions,
  stepLabelFromIndex,
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

  describe('stepLabelFromIndex', () => {
    it('maps each step index to its label', () => {
      expect(stepLabelFromIndex(0)).toBe('q1');
      expect(stepLabelFromIndex(1)).toBe('q2');
      expect(stepLabelFromIndex(2)).toBe('q3');
      expect(stepLabelFromIndex(3)).toBe('warning');
    });
  });

  describe('getAnswerRecord', () => {
    it('returns the answer key for each question answered', () => {
      const answers: Answers = { q1: redFlag, q2: q2Clean, q3: q3Flag };

      expect(getAnswerRecord(answers)).toStrictEqual({
        q1_answer: 'q1_yes',
        q2_answer: 'q2_goods',
        q3_answer: 'q3_yes',
      });
    });

    it('returns null for questions that were not answered', () => {
      expect(getAnswerRecord({ q1: noFlag })).toStrictEqual({
        q1_answer: 'q1_no',
        q2_answer: null,
        q3_answer: null,
      });
    });

    it('returns null for every question when nothing is answered', () => {
      expect(getAnswerRecord({})).toStrictEqual({
        q1_answer: null,
        q2_answer: null,
        q3_answer: null,
      });
    });
  });
});
