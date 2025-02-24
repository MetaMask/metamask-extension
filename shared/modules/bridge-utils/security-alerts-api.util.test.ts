import {
  TokenFeature,
  TokenFeatureType,
} from '../../types/security-alerts-api';
import { getTokenFeatureTitleDescriptionIds } from './security-alerts-api.util';

describe('Security alerts utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenFeatureTitleDescriptionIds', () => {
    it('Should correctly add title Id and Description Id', async () => {
      const mockTokenAlert = <TokenFeature>{
        type: TokenFeatureType.MALICIOUS,
        feature_id: 'UNSTABLE_TOKEN_PRICE',
        description: 'This token is Malicious',
      };

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeTruthy();
      expect(tokenAlertWithLabelIds.descriptionId).toBeTruthy();
    });

    it('Should correctly return title Id and Description Id null if not available', async () => {
      const mockTokenAlert = <TokenFeature>{
        type: TokenFeatureType.BENIGN,
        feature_id: 'BENIGN_TYPE',
        description: 'This token is Benign',
      };

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeNull();
      expect(tokenAlertWithLabelIds.descriptionId).toBeNull();
    });
  });

  
});
