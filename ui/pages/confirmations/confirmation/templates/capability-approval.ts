import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

type CapabilityApprovalActions = {
  resolvePendingApproval: (id: string, value: unknown) => void;
};

function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  _t: (key: string) => string,
  actions: CapabilityApprovalActions,
) {
  const { requestData } = pendingApproval;
  const { capabilityName, description, methodNames, sourceCode } = requestData;

  return {
    content: [
      {
        element: 'CapabilityApproval',
        key: 'capability-approval',
        props: {
          capabilityName,
          description,
          methodNames,
          sourceCode,
          onApprove: (edited: {
            capabilityName: string;
            description: string;
            methodNames: string[];
            sourceCode: string;
          }) =>
            actions.resolvePendingApproval(pendingApproval.id, {
              approved: true,
              ...edited,
            }),
          onReject: () =>
            actions.resolvePendingApproval(pendingApproval.id, {
              approved: false,
            }),
        },
      },
    ],
    hideSubmitButton: true,
  };
}

const capabilityApproval = {
  getValues,
};

export default capabilityApproval;
