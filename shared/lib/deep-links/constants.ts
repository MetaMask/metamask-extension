// no destructuring as process.env detection stops working
// eslint-disable-next-line prefer-destructuring
export const DEEP_LINK_HOST = process.env.DEEP_LINK_HOST;
export const DEEP_LINK_MAX_LENGTH = 2048;
export const SIG_PARAM = 'sig';
export const SIG_PARAMS_PARAM = 'sig_params';

export type TrackingParameter =
  | 'utm_campaign'
  | 'utm_content'
  | 'utm_medium'
  | 'utm_source'
  | 'utm_term'
  | 'attribution_id';

export const TRACKING_PARAMETERS = new Set([
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
  'attribution_id',
]) as Set<TrackingParameter> & { has: (key: string) => key is TrackingParameter };
