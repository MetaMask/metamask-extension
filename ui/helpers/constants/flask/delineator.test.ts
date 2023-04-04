import { DelineatorType, getDelineatorTitle } from './delineator';

describe('delineator utils', () => {
  describe('getDelineatorTitle', () => {
    it('should return the good key for an error delineator type', () => {
      const result = getDelineatorTitle(DelineatorType.Error);

      expect(result).toStrictEqual('errorWithSnap');
    });

    it('should return the good key for an insights delineator type', () => {
      const result = getDelineatorTitle(DelineatorType.Insights);

      expect(result).toStrictEqual('insightsFromSnap');
    });

    it('should return the content key for any other types', () => {
      const result = getDelineatorTitle(DelineatorType.Content);

      expect(result).toStrictEqual('contentFromSnap');
    });
  });
});
