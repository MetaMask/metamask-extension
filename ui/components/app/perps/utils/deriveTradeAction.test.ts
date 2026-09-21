import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { derivePerpsTradeAction } from './deriveTradeAction';

describe('derivePerpsTradeAction', () => {
  it('returns create_position when there is no existing position', () => {
    expect(derivePerpsTradeAction(null, 'long')).toBe(
      PERPS_EVENT_VALUE.ACTION.CREATE_POSITION,
    );
    expect(derivePerpsTradeAction(null, 'short')).toBe(
      PERPS_EVENT_VALUE.ACTION.CREATE_POSITION,
    );
  });

  it('returns increase_exposure when the order matches the position direction', () => {
    expect(derivePerpsTradeAction('long', 'long')).toBe(
      PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE,
    );
    expect(derivePerpsTradeAction('short', 'short')).toBe(
      PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE,
    );
  });

  it('omits the action when an opposite-side order only reduces the position', () => {
    // 1 short against a 2 long closes half — `willFlipPosition` says no flip, so
    // reporting one would contradict the confirmation UI. The controller's
    // ACTION enum has no reduce member, so the property is omitted instead.
    expect(
      derivePerpsTradeAction('long', 'short', {
        orderSize: 1,
        positionSize: 2,
      }),
    ).toBeUndefined();
  });

  it('omits the action when an opposite-side order exactly closes the position', () => {
    expect(
      derivePerpsTradeAction('short', 'long', {
        orderSize: 2,
        positionSize: -2,
      }),
    ).toBeUndefined();
  });

  it('still reports a flip when the opposite-side order overshoots the position', () => {
    expect(
      derivePerpsTradeAction('long', 'short', {
        orderSize: 3,
        positionSize: 2,
      }),
    ).toBe(PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT);
  });

  it('returns flip_long_to_short for a short order against a long position', () => {
    expect(derivePerpsTradeAction('long', 'short')).toBe(
      PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT,
    );
  });

  it('returns flip_short_to_long for a long order against a short position', () => {
    expect(derivePerpsTradeAction('short', 'long')).toBe(
      PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG,
    );
  });
});
