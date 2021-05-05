import sinon from 'sinon';

import { setMaxModeTo, updateSendAmount } from '../../../../../store/actions';

import { updateSendErrors } from '../../../../../ducks/send/send.duck';

let mapStateToProps;
let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (ms, md) => {
    mapStateToProps = ms;
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../../../app/selectors', () => ({
  getGasTotal: (s) => `mockGasTotal:${s}`,
  getSendToken: (s) => `mockSendToken:${s}`,
  getSendFromBalance: (s) => `mockBalance:${s}`,
  getTokenBalance: (s) => `mockTokenBalance:${s}`,
  getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
  getBasicGasEstimateLoadingStatus: (s) => `mockButtonDataLoading:${s}`,
}));

jest.mock('./amount-max-button.utils.js', () => ({
  calcMaxAmount: (mockObj) => mockObj.val + 1,
}));

jest.mock('../../../../../../app/store/actions', () => ({
  setMaxModeTo: jest.fn(),
  updateSendAmount: jest.fn(),
}));
jest.mock('../../../../../../app/ducks/send/send.duck', () => ({
  updateSendErrors: jest.fn(),
}));

require('./amount-max-button.container.js');

describe('amount-max-button container', () => {
  describe('mapStateToProps()', () => {
    it('should map the correct properties to props', () => {
      expect(mapStateToProps('mockState')).toStrictEqual({
        balance: 'mockBalance:mockState',
        buttonDataLoading: 'mockButtonDataLoading:mockState',
        gasTotal: 'mockGasTotal:mockState',
        maxModeOn: 'mockMaxModeOn:mockState',
        sendToken: 'mockSendToken:mockState',
        tokenBalance: 'mockTokenBalance:mockState',
      });
    });
  });

  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('setAmountToMax()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setAmountToMax({ val: 11, foo: 'bar' });
        expect(dispatchSpy.calledTwice).toStrictEqual(true);
        expect(updateSendErrors).toHaveBeenCalled();
        expect(updateSendErrors).toHaveBeenCalledWith({ amount: null });
        expect(updateSendAmount).toHaveBeenCalled();
        expect(updateSendAmount).toHaveBeenCalledWith(12);
      });
    });

    describe('setMaxModeTo()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setMaxModeTo('mockVal');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(setMaxModeTo).toHaveBeenCalledWith('mockVal');
      });
    });
  });
});
