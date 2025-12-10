import {
  DEFAULT_CLAIMS_CONFIGURATIONS,
  ClaimsControllerState,
} from '@metamask/claims-controller';
import {
  getSupportedNetworksForClaim,
  getValidSubmissionWindowDays,
} from './claims';

describe('shield claims selectors', () => {
  const DEFAULT_STATE: ClaimsControllerState = {
    claimsConfigurations: DEFAULT_CLAIMS_CONFIGURATIONS,
    claims: [],
  };

  it('should return the supported networks for claim', () => {
    const result = getSupportedNetworksForClaim({
      metamask: DEFAULT_STATE,
    });
    expect(result).toEqual(
      DEFAULT_STATE.claimsConfigurations.supportedNetworks,
    );
  });

  it('should return the valid submission window days for claim', () => {
    const result = getValidSubmissionWindowDays({
      metamask: DEFAULT_STATE,
    });
    expect(result).toEqual(
      DEFAULT_STATE.claimsConfigurations.validSubmissionWindowDays,
    );
  });
});
