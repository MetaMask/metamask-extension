import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import { Platform } from '../../../../types/global';
import useConfirmationAlertActions from './useConfirmationAlertActions';

const EXPECTED_BUY_URL =
  'https://portfolio.test/buy?metamaskEntry=ext_buy_sell_button&chainId=0x5';

function processAlertActionKey(actionKey: string) {
  const { result } = renderHookWithProvider(
    useConfirmationAlertActions,
    mockState,
  );

  result.current(actionKey);
}

describe('useConfirmationAlertActions', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    global.platform = { openTab: jest.fn() } as unknown as Platform;
  });

  it('opens portfolio tab if action key is buy', () => {
    processAlertActionKey(AlertActionKey.Buy);

    expect(global.platform.openTab).toHaveBeenCalledTimes(1);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: EXPECTED_BUY_URL,
    });
  });
});
