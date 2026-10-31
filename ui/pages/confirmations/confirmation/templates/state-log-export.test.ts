import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import stateLogExport from './state-log-export';

const APPROVAL_ID_MOCK = 'approval-id-1';

const PENDING_APPROVAL_MOCK = {
  id: APPROVAL_ID_MOCK,
  origin: 'https://support.metamask.io',
  requestData: {},
} as unknown as ApprovalRequest<Record<string, Json>>;

const t = (key: string) => key;

function buildActions() {
  return {
    resolvePendingApproval: jest.fn(),
    rejectPendingApproval: jest.fn(),
  };
}

describe('state-log-export template', () => {
  afterEach(() => {
    delete (window as unknown as { logStateString?: unknown }).logStateString;
  });

  describe('onSubmit', () => {
    it('resolves the approval with the same payload the settings download uses', async () => {
      const actions = buildActions();
      window.logStateString = jest.fn().mockResolvedValue('{"metamask":{}}');

      await stateLogExport
        .getValues(PENDING_APPROVAL_MOCK, t, actions)
        .onSubmit();

      expect(window.logStateString).toHaveBeenCalledTimes(1);
      expect(actions.resolvePendingApproval).toHaveBeenCalledWith(
        APPROVAL_ID_MOCK,
        '{"metamask":{}}',
      );
      expect(actions.rejectPendingApproval).not.toHaveBeenCalled();
    });

    it('rejects the approval when building the logs fails', async () => {
      const actions = buildActions();
      window.logStateString = jest.fn().mockRejectedValue(new Error('boom'));

      await stateLogExport
        .getValues(PENDING_APPROVAL_MOCK, t, actions)
        .onSubmit();

      expect(actions.resolvePendingApproval).not.toHaveBeenCalled();
      expect(actions.rejectPendingApproval).toHaveBeenCalledWith(
        APPROVAL_ID_MOCK,
        expect.objectContaining({ code: -32603, message: 'boom' }),
      );
    });
  });

  describe('onCancel', () => {
    it('rejects the approval with a user rejected request error', () => {
      const actions = buildActions();

      stateLogExport.getValues(PENDING_APPROVAL_MOCK, t, actions).onCancel();

      expect(actions.rejectPendingApproval).toHaveBeenCalledWith(
        APPROVAL_ID_MOCK,
        expect.objectContaining({ code: 4001 }),
      );
    });
  });
});
