import {
  FeatureId,
  MetaMetricsSwapsEventSource,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  getBridgeLocation,
  resetBridgeController,
  setBridgeLocation,
  setInputPrimaryDenomination,
  trackUnifiedSwapBridgeEvent,
} from './actions';

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('bridge background actions', () => {
  beforeEach(() => {
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  describe('setBridgeLocation', () => {
    it('sets the location through the messenger', async () => {
      await setBridgeLocation(MetaMetricsSwapsEventSource.TokenView)(jest.fn());

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'BridgeController:setLocation',
        [MetaMetricsSwapsEventSource.TokenView],
      );
    });
  });

  describe('getBridgeLocation', () => {
    it('returns the location from the messenger', async () => {
      jest
        .mocked(submitRequestToBackground)
        .mockResolvedValue(MetaMetricsSwapsEventSource.MainView);

      const location = await getBridgeLocation();

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'BridgeController:getLocation',
      );
      expect(location).toBe(MetaMetricsSwapsEventSource.MainView);
    });
  });

  describe('setInputPrimaryDenomination', () => {
    it('sets the denomination through the messenger', async () => {
      await setInputPrimaryDenomination('fiat_value')(jest.fn());

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'BridgeController:setInputPrimaryDenomination',
        ['fiat_value'],
      );
    });
  });

  describe('resetBridgeController', () => {
    it('resets the controller through the messenger', async () => {
      const dispatch = jest.fn();

      await resetBridgeController()(dispatch);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'BridgeController:resetState',
      );
      expect(submitRequestToBackground).toHaveBeenCalledWith('getStatePatches');
    });
  });

  describe('trackUnifiedSwapBridgeEvent', () => {
    it('tracks events through the messenger', async () => {
      const dispatch = jest.fn();

      await trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.PageViewed, {
        location: MetaMetricsSwapsEventSource.MainView,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
        feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
      })(dispatch);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'BridgeController:trackUnifiedSwapBridgeEvent',
        [
          UnifiedSwapBridgeEventName.PageViewed,
          {
            location: MetaMetricsSwapsEventSource.MainView,
            // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
            feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
          },
        ],
      );
      expect(submitRequestToBackground).toHaveBeenCalledWith('getStatePatches');
    });
  });
});
