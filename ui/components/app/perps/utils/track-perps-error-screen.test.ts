import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { trackPerpsErrorScreenViewed } from './track-perps-error-screen';

describe('trackPerpsErrorScreenViewed', () => {
  it('emits a PERPS_SCREEN_VIEWED error event with error_type and screen_name', () => {
    const track = jest.fn();

    trackPerpsErrorScreenViewed(
      track,
      PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
      PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_MARKET_DETAILS,
    );

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(MetaMetricsEventName.PerpsScreenViewed, {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.ERROR,
      [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
      // Pinned as a literal too: the emitted value is an analytics contract, so
      // a change to the constant must fail here rather than pass silently.
      [PERPS_EVENT_PROPERTY.SCREEN_NAME]: 'perps_market_details',
    });
  });
});
