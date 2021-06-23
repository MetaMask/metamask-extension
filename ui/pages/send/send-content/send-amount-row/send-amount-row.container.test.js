import sinon from 'sinon';

import { updateSendAmount } from '../../../../ducks/send';

let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (_, md) => {
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../ducks/send', () => ({
  updateSendAmount: jest.fn(),
}));

require('./send-amount-row.container.js');

describe('send-amount-row container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('updateSendAmount()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendAmount('mockAmount');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(updateSendAmount).toHaveBeenCalled();
        expect(updateSendAmount).toHaveBeenCalledWith('mockAmount');
      });
    });
  });
});
