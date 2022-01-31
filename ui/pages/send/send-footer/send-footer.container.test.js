import sinon from 'sinon';

import { addToAddressBook, cancelTx } from '../../../store/actions';
import { resetSendState, signTransaction } from '../../../ducks/send';

let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (_, md) => {
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../store/actions.js', () => ({
  addToAddressBook: jest.fn(),
  cancelTx: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getSendToAccounts: (s) => [`mockToAccounts:${s}`],
}));

jest.mock('../../../ducks/send', () => ({
  getGasPrice: (s) => `mockGasPrice:${s}`,
  getSendTo: (s) => `mockTo:${s}`,
  getSendErrors: (s) => `mockSendErrors:${s}`,
  getSendStage: (s) => `mockStage:${s}`,
  getDraftTransaction: (s) => ({ id: `draftTransaction:${s}` }),
  resetSendState: jest.fn(),
  signTransaction: jest.fn(),
}));

jest.mock('../../../selectors/custom-gas.js', () => ({
  getRenderableEstimateDataForSmallButtonsFromGWEI: (s) => [
    { gasEstimateType: `mockGasEstimateType:${s}` },
  ],
}));
require('./send-footer.container.js');

describe('send-footer container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('resetSendState()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.resetSendState();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(resetSendState).toHaveBeenCalled();
      });
    });

    describe('cancelTx()', () => {
      it('should dispatch an action', () => {
        const draftTansaction = { id: 'ID' };
        mapDispatchToPropsObject.cancelTx(draftTansaction);
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(cancelTx).toHaveBeenCalledTimes(1);
        expect(cancelTx).toHaveBeenCalledWith(draftTansaction);
      });
    });

    describe('sign()', () => {
      it('should dispatch a signTransaction action', () => {
        mapDispatchToPropsObject.sign();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(signTransaction).toHaveBeenCalledTimes(1);
      });
    });

    describe('addToAddressBookIfNew()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.addToAddressBookIfNew(
          'mockNewAddress',
          [{ address: 'mockToAccounts' }],
          'mockNickname',
        );
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(addToAddressBook).toHaveBeenCalledWith(
          '0xmockNewAddress',
          'mockNickname',
        );
      });
    });
  });
});
