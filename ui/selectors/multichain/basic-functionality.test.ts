import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsBasicFunctionalityForcedOnDuringOnboarding } from './basic-functionality';

const mockGetIsBasicFunctionalityConsolidationEnabledInBuild = jest.fn(
  () => true,
);

jest.mock('../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../shared/lib/environment'),
  getIsBasicFunctionalityConsolidationEnabledInBuild: () =>
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild(),
}));

const stateWithFlow = (firstTimeFlowType: FirstTimeFlowType | null) => ({
  metamask: { firstTimeFlowType },
});

describe('getIsBasicFunctionalityForcedOnDuringOnboarding', () => {
  beforeEach(() => {
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      true,
    );
  });

  it('returns true for social login flows when consolidation is in the build', () => {
    expect(
      getIsBasicFunctionalityForcedOnDuringOnboarding(
        stateWithFlow(FirstTimeFlowType.socialCreate),
      ),
    ).toBe(true);
    expect(
      getIsBasicFunctionalityForcedOnDuringOnboarding(
        stateWithFlow(FirstTimeFlowType.socialImport),
      ),
    ).toBe(true);
  });

  it('returns false for secret recovery phrase flows', () => {
    expect(
      getIsBasicFunctionalityForcedOnDuringOnboarding(
        stateWithFlow(FirstTimeFlowType.create),
      ),
    ).toBe(false);
    expect(
      getIsBasicFunctionalityForcedOnDuringOnboarding(
        stateWithFlow(FirstTimeFlowType.import),
      ),
    ).toBe(false);
  });

  it('returns false for social login flows when consolidation is not in the build', () => {
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      false,
    );

    expect(
      getIsBasicFunctionalityForcedOnDuringOnboarding(
        stateWithFlow(FirstTimeFlowType.socialCreate),
      ),
    ).toBe(false);
  });
});
