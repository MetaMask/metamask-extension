// Admitted series and their `δ_block` in ms. Keep it import-free: the main
// detector loads it without an install.
export type AdmittedSeries = {
  readonly series: string;
  /**
   * `δ_block` in ms: `max(33, 10% of the A/A median less the series' listed fixed
   * waits)`, of the A/A mean for the long-task series, or half the smallest planted
   * regression the series catches at the recall bar, if larger.
   */
  readonly deltaBlockMs: number;
};

export const ADMITTED_SERIES: readonly AdmittedSeries[] = [
  // Bridge's three steps.
  { series: 'bridgeUserActions.bridge_load_page', deltaBlockMs: 33 },
  { series: 'bridgeUserActions.bridge_load_asset_picker', deltaBlockMs: 33 },
  { series: 'bridgeUserActions.bridge_search_token', deltaBlockMs: 35.505 },

  // Startup, standard home.
  { series: 'startupStandardHome.loadScripts', deltaBlockMs: 94.11 },
  { series: 'startupStandardHome.domContentLoaded', deltaBlockMs: 95.795 },
  { series: 'startupStandardHome.load', deltaBlockMs: 96.37 },
  { series: 'startupStandardHome.heroPainted', deltaBlockMs: 119.27 },

  // Asset details and Solana asset details. Recall was measured on 28
  // further comparisons per series, since 14 left each one detection short.
  { series: 'assetDetails.assetClickToPriceChart', deltaBlockMs: 36.055 },
  { series: 'solanaAssetDetails.assetClickToPriceChart', deltaBlockMs: 33 },

  // Add account. Recall missed at 2 x 34.81 ms and passed with a 100 ms hold.
  { series: 'loadNewAccount.load_new_account', deltaBlockMs: 50 },

  // Bridge long-task total and total blocking time.
  { series: 'bridgeUserActions.longTaskTotalDuration', deltaBlockMs: 33 },
  { series: 'bridgeUserActions.tbt', deltaBlockMs: 33 },

  // Asset details and Solana asset details long-task total and total blocking
  // time, measured from the click (#48050). Each caught 27 or 28 of 28 holds.
  { series: 'assetDetails.longTaskTotalDuration', deltaBlockMs: 33 },
  { series: 'assetDetails.tbt', deltaBlockMs: 33 },
  { series: 'solanaAssetDetails.longTaskTotalDuration', deltaBlockMs: 33 },
  { series: 'solanaAssetDetails.tbt', deltaBlockMs: 33 },
];

/** `δ_block` in ms for an admitted series, `undefined` for any other. */
export function getAdmittedDeltaBlockMs(series: string): number | undefined {
  return ADMITTED_SERIES.find((entry) => entry.series === series)?.deltaBlockMs;
}
