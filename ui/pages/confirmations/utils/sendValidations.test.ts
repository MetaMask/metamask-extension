// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';
import { findConfusablesInRecipient } from './sendValidations';

jest.mock('unicode-confusables');

describe('SendValidations', () => {
  describe('findConfusablesInRecipient', () => {
    const mockConfusables = jest.mocked(confusables);

    beforeEach(() => {
      jest.clearAllMocks();
      mockConfusables.mockReturnValue([]);
    });

    it('returns successful validation when no confusables found', async () => {
      const result = await findConfusablesInRecipient('example.eth');

      expect(result).toEqual({});
    });

    it('returns warning when confusable characters found', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result).toEqual({
        confusableCharacters: [
          { point: 'а', similarTo: 'a' },
          { point: 'е', similarTo: 'e' },
        ],
        warning: 'confusingEnsDomain',
      });
    });

    it('handles zero-width confusable characters', async () => {
      mockConfusables.mockReturnValue([
        { point: '‌', similarTo: '' },
        { point: 'a', similarTo: 'a' },
      ]);

      const result = await findConfusablesInRecipient('exa‌mple.eth');

      expect(result).toEqual({
        error: 'invalidAddress',
        warning: 'confusableZeroWidthUnicode',
      });
    });

    it('filters out duplicate confusable points', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result.confusableCharacters).toEqual([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);
    });

    it('filters out confusable characters with undefined similarTo', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'х', similarTo: undefined },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result.confusableCharacters).toEqual([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);
    });
  });
});
