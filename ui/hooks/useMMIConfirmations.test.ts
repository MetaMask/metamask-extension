import mockState from '../../test/data/mock-state.json';

import { unapprovedPersonalSignMsg } from '../../test/data/confirmations/personal_sign';
import { getMockPersonalSignConfirmStateForRequest } from '../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../test/lib/confirmations/render-helpers';
import { useMMIConfirmations } from './useMMIConfirmations';

const mockCustodySignFn = jest.fn();
jest.mock('./useMMICustodySignMessage', () => ({
  useMMICustodySignMessage: () => ({ custodySignFn: mockCustodySignFn }),
}));

const render = () => {
  const state = getMockPersonalSignConfirmStateForRequest(
    {
      ...unapprovedPersonalSignMsg,
      custodyId: 'DUMMY_ID',
    },
    {
      metamask: {
        ...mockState.metamask,
      },
    },
  );

  return renderHookWithConfirmContextProvider(
    () => useMMIConfirmations(),
    state,
  );
};

describe('useMMIConfirmations', () => {
  it('mmiSubmitDisabled should be true if confirmation is signature request with custodyId defined', async () => {
    const { result } = render();
    expect(result.current.mmiSubmitDisabled).toEqual(true);
  });

  it('when invoking mmiOnSignCallback it should call useMMICustodySignMessage:custodySignFn with current confirmation', async () => {
    const { result } = render();
    result.current.mmiOnSignCallback();
    expect(mockCustodySignFn).toBeCalledTimes(1);
  });
});
