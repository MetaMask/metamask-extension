import { ADMITTED_SERIES, getAdmittedDeltaBlockMs } from './gated-metrics';
import { METRIC } from './thresholds';

describe('ADMITTED_SERIES', () => {
  it('lists each series once, with a delta at or above the 33 ms floor', () => {
    const names = ADMITTED_SERIES.map((entry) => entry.series);
    expect(new Set(names).size).toBe(names.length);
    for (const { deltaBlockMs } of ADMITTED_SERIES) {
      expect(deltaBlockMs).toBeGreaterThanOrEqual(33);
    }
  });

  it('holds the sixteen series with a GATE verdict', () => {
    expect(ADMITTED_SERIES).toHaveLength(16);
  });

  it('keys the startup series that have a METRIC constant by it', () => {
    expect(
      getAdmittedDeltaBlockMs(METRIC.startupStandardHome.loadScripts),
    ).toBe(94.11);
    expect(getAdmittedDeltaBlockMs(METRIC.startupStandardHome.load)).toBe(
      96.37,
    );
  });

  it('admits add account at the size its recall passed at', () => {
    expect(getAdmittedDeltaBlockMs('loadNewAccount.load_new_account')).toBe(50);
  });

  it("admits the asset flows' blocking series at the 33 ms floor", () => {
    expect(getAdmittedDeltaBlockMs('assetDetails.tbt')).toBe(33);
    expect(
      getAdmittedDeltaBlockMs('solanaAssetDetails.longTaskTotalDuration'),
    ).toBe(33);
  });

  it('leaves out series without a verdict', () => {
    expect(
      getAdmittedDeltaBlockMs(METRIC.startupStandardHome.uiStartup),
    ).toBeUndefined();
  });
});
