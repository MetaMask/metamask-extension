import sinon from 'sinon';

import {
  clearSend,
  signTx,
  signTokenTx,
  addToAddressBook,
} from '../../../store/actions';
import {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
} from './send-footer.utils';

let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (_, md) => {
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../app/store/actions.js', () => ({
  addToAddressBook: jest.fn(),
  clearSend: jest.fn(),
  signTokenTx: jest.fn(),
  signTx: jest.fn(),
  updateTransaction: jest.fn(),
}));

jest.mock('../../../../app/selectors/send.js', () => ({
  getGasLimit: (s) => `mockGasLimit:${s}`,
  getGasPrice: (s) => `mockGasPrice:${s}`,
  getGasTotal: (s) => `mockGasTotal:${s}`,
  getSendToken: (s) => `mockSendToken:${s}`,
  getSendAmount: (s) => `mockAmount:${s}`,
  getSendEditingTransactionId: (s) => `mockEditingTransactionId:${s}`,
  getSendFromObject: (s) => `mockFromObject:${s}`,
  getSendTo: (s) => `mockTo:${s}`,
  getSendToNickname: (s) => `mockToNickname:${s}`,
  getSendToAccounts: (s) => `mockToAccounts:${s}`,
  getTokenBalance: (s) => `mockTokenBalance:${s}`,
  getSendHexData: (s) => `mockHexData:${s}`,
  getUnapprovedTxs: (s) => `mockUnapprovedTxs:${s}`,
  getSendErrors: (s) => `mockSendErrors:${s}`,
  isSendFormInError: (s) => `mockInError:${s}`,
  getDefaultActiveButtonIndex: () => 0,
}));

jest.mock('../../../../app/selectors/custom-gas.js', () => ({
  getRenderableEstimateDataForSmallButtonsFromGWEI: (s) => [
    { gasEstimateType: `mockGasEstimateType:${s}` },
  ],
}));

jest.mock('./send-footer.utils', () => ({
  addressIsNew: jest.fn().mockReturnValue(true),
  constructTxParams: jest.fn().mockReturnValue({ value: 'mockAmount' }),
  constructUpdatedTx: jest
    .fn()
    .mockReturnValue('mockConstructedUpdatedTxParams'),
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

    describe('clearSend()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.clearSend();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(clearSend).toHaveBeenCalled();
      });
    });

    describe('sign()', () => {
      it('should dispatch a signTokenTx action if sendToken is defined', () => {
        mapDispatchToPropsObject.sign({
          sendToken: {
            address: '0xabc',
          },
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        });
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(constructTxParams).toHaveBeenCalledWith({
          data: undefined,
          sendToken: {
            address: '0xabc',
          },
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        });
        expect(signTokenTx).toHaveBeenCalledWith(
          '0xabc',
          'mockTo',
          'mockAmount',
          { value: 'mockAmount' },
        );
      });

      it('should dispatch a sign action if sendToken is not defined', () => {
        mapDispatchToPropsObject.sign({
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        });
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(constructTxParams).toHaveBeenCalledWith({
          data: undefined,
          sendToken: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        });
        expect(signTx).toHaveBeenCalledWith({
          value: 'mockAmount',
        });
      });
    });

    describe('update()', () => {
      it('should dispatch an updateTransaction action', () => {
        mapDispatchToPropsObject.update({
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
          editingTransactionId: 'mockEditingTransactionId',
          sendToken: { address: 'mockAddress' },
          unapprovedTxs: 'mockUnapprovedTxs',
        });
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(constructUpdatedTx).toHaveBeenCalledWith({
          data: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
          editingTransactionId: 'mockEditingTransactionId',
          sendToken: { address: 'mockAddress' },
          unapprovedTxs: 'mockUnapprovedTxs',
        });
      });
    });

    describe('addToAddressBookIfNew()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.addToAddressBookIfNew(
          'mockNewAddress',
          'mockToAccounts',
          'mockNickname',
        );
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(addressIsNew).toHaveBeenCalledWith(
          'mockToAccounts',
          '0xmockNewAddress',
        );
        expect(addToAddressBook).toHaveBeenCalledWith(
          '0xmockNewAddress',
          'mockNickname',
        );
      });
    });
  });
});
