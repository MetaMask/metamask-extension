import { ADMITTED_SERIES, getAdmittedDeltaBlockMs } from './admitted-series';
import { METRIC } from './thresholds';

describe('ADMITTED_SERIES', () => {
  it('lists each series once, with a delta at or above the 33 ms floor', () => {
    const names = ADMITTED_SERIES.map((entry) => entry.series);
    expect(new Set(names).size).toBe(names.length);
    for (const { deltaBlockMs } of ADMITTED_SERIES) {
      expect(deltaBlockMs).toBeGreaterThanOrEqual(33);
    }
  });

  it('holds the eleven series with a GATE verdict', () => {
    expect(ADMITTED_SERIES).toHaveLength(11);
  });

  it('keys the startup series that have a METRIC constant by it', () => {
    expect(
      getAdmittedDeltaBlockMs(METRIC.startupStandardHome.loadScripts),
    ).toBe(94.11);
    expect(getAdmittedDeltaBlockMs(METRIC.startupStandardHome.load)).toBe(
      96.37,
    );
  });

  it('leaves out series without a verdict', () => {
    expect(
      getAdmittedDeltaBlockMs('loadNewAccount.load_new_account'),
    ).toBeUndefined();
    expect(
      getAdmittedDeltaBlockMs(METRIC.startupStandardHome.uiStartup),
    ).toBeUndefined();
  });
});
