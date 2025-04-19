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
    it('should correctly add title Id and Description Id', async () => {
      const mockTokenAlert = {
        type: TokenFeatureType.MALICIOUS,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_id: 'UNSTABLE_TOKEN_PRICE',
        description: 'This token is Malicious',
      } as TokenFeature;

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeTruthy();
      expect(tokenAlertWithLabelIds.descriptionId).toBeTruthy();
    });

    it('should correctly return title Id and Description Id null if not available', async () => {
      const mockTokenAlert = {
        type: TokenFeatureType.BENIGN,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_id: 'BENIGN_TYPE',
        description: 'This token is Benign',
      } as TokenFeature;

      const tokenAlertWithLabelIds =
        getTokenFeatureTitleDescriptionIds(mockTokenAlert);
      expect(tokenAlertWithLabelIds.titleId).toBeNull();
      expect(tokenAlertWithLabelIds.descriptionId).toBeNull();
    });
  });
});
