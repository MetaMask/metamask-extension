import { getBasicFunctionalityConsolidationPlan } from './basic-functionality-consolidation';

describe('getBasicFunctionalityConsolidationPlan', () => {
  const allEnabled = {
    useExternalServices: true,
    useCurrencyRateCheck: true,
    securityAlertsEnabled: true,
    usePhishDetect: true,
    useMultiAccountBalanceChecker: true,
    useSafeChainsListValidation: true,
    useTokenDetection: true,
    useTransactionSimulations: true,
    use4ByteResolution: true,
    openSeaEnabled: true,
    useNftDetection: true,
    useExternalNameSources: true,
    useAddressBarEnsResolution: true,
  };

  const allDisabled = {
    useExternalServices: false,
    useCurrencyRateCheck: false,
    securityAlertsEnabled: false,
    usePhishDetect: false,
    useMultiAccountBalanceChecker: false,
    useSafeChainsListValidation: false,
    useTokenDetection: false,
    useTransactionSimulations: false,
    use4ByteResolution: false,
    openSeaEnabled: false,
    useNftDetection: false,
    useExternalNameSources: false,
    useAddressBarEnsResolution: false,
  };

  it('schedules a toast for mixed settings', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(
        { ...allEnabled, useTokenDetection: false },
        false,
      ),
    ).toStrictEqual({
      landingState: true,
      notification: 'toast',
    });
  });

  it('schedules no notice for consistent settings', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(allDisabled, false),
    ).toStrictEqual({
      landingState: false,
      notification: null,
    });
  });

  it('schedules a modal and enables BFT for social-login users', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(allDisabled, true),
    ).toStrictEqual({
      landingState: true,
      notification: 'modal',
    });
  });
});
