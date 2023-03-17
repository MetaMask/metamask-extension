import { TransactionStatus } from '../../../shared/constants/transaction';
import PersonalMessageManager from './personal-message-manager';

describe('Personal Message Manager', () => {
  let messageManager;

  beforeEach(() => {
    messageManager = new PersonalMessageManager({
      metricsEvent: jest.fn(),
      securityProviderRequest: jest.fn(),
    });
  });

  describe('#getMsgList', () => {
    it('when new should return empty array', () => {
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('#addMsg', () => {
    it('adds a Msg returned in getMsgList', () => {
      const Msg = {
        id: 1,
        status: TransactionStatus.approved,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toStrictEqual(1);
    });
  });

  describe('#setMsgStatusApproved', () => {
    it('sets the Msg status to approved', () => {
      const Msg = {
        id: 1,
        status: TransactionStatus.unapproved,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      messageManager.setMsgStatusApproved(1);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].status).toStrictEqual(TransactionStatus.approved);
    });
  });

  describe('#rejectMsg', () => {
    it('sets the Msg status to rejected', () => {
      const Msg = {
        id: 1,
        status: TransactionStatus.unapproved,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      messageManager.rejectMsg(1);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].status).toStrictEqual(TransactionStatus.rejected);
    });
  });

  describe('#_updateMsg', () => {
    it('replaces the Msg with the same id', () => {
      messageManager.addMsg({
        id: '1',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TransactionStatus.approved,
        metamaskNetworkId: 'unit test',
      });
      messageManager._updateMsg({
        id: '1',
        status: 'blah',
        hash: 'foo',
        metamaskNetworkId: 'unit test',
      });
      const result = messageManager.getMsg('1');
      expect(result.hash).toStrictEqual('foo');
    });
  });

  describe('#getUnapprovedMsgs', () => {
    it('returns unapproved Msgs in a hash', () => {
      messageManager.addMsg({
        id: '1',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TransactionStatus.approved,
        metamaskNetworkId: 'unit test',
      });
      const result = messageManager.getUnapprovedMsgs();
      expect(typeof result).toStrictEqual('object');
      expect(result['1'].status).toStrictEqual(TransactionStatus.unapproved);
      expect(result['2']).toBeUndefined();
    });
  });

  describe('#getMsg', () => {
    it('returns a Msg with the requested id', () => {
      messageManager.addMsg({
        id: '1',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TransactionStatus.approved,
        metamaskNetworkId: 'unit test',
      });
      expect(messageManager.getMsg('1').status).toStrictEqual(
        TransactionStatus.unapproved,
      );
      expect(messageManager.getMsg('2').status).toStrictEqual(
        TransactionStatus.approved,
      );
    });
  });

  describe('#normalizeMsgData', () => {
    it('converts text to a utf8 hex string', () => {
      const input = 'hello';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x68656c6c6f');
    });

    it('tolerates a hex prefix', () => {
      const input = '0x12';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x12');
    });

    it('tolerates normal hex', () => {
      const input = '12';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x12');
    });
  });

  describe('#addUnapprovedMessage', () => {
    const origin = 'http://localhost:8080';
    const from = '0xFb2C15004343904e5f4082578c4e8e11105cF7e3';
    const msgParams = {
      from,
      data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
    };

    it('should detect SIWE messages', async () => {
      const request = { origin };
      const nonSiweMsgParams = {
        from,
        data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
      };
      // siwe message
      const msgId = await messageManager.addUnapprovedMessage(
        msgParams,
        request,
      );
      const result = messageManager.getMsg(msgId);
      expect(result.msgParams.siwe.isSIWEMessage).toStrictEqual(true);
      // non-siwe message
      const msgId2 = await messageManager.addUnapprovedMessage(
        nonSiweMsgParams,
        request,
      );
      const result2 = messageManager.getMsg(msgId2);
      expect(result2.msgParams.siwe.isSIWEMessage).toStrictEqual(false);
    });
  });
});
