import type { SignatureController } from '@metamask/signature-controller';
import type {
  OriginalRequest,
  TypedMessageParams,
} from '@metamask/message-manager';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

export type SignatureParams = [TypedMessageParams, OriginalRequest];

export type MessageType = keyof typeof MESSAGE_TYPE;

export type AddSignatureMessageRequest = {
  signatureParams: SignatureParams;
  signatureController: SignatureController;
  type: MessageType;
};

const MESSAGE_TYPE_TO_FUNCTION = {
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA as MessageType]: 'newUnsignedTypedMessage',
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1 as MessageType]:
    'newUnsignedTypedMessage',
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 as MessageType]:
    'newUnsignedTypedMessage',
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4 as MessageType]:
    'newUnsignedTypedMessage',
  [MESSAGE_TYPE.PERSONAL_SIGN as MessageType]: 'newUnsignedPersonalMessage',
} as Record<MessageType, keyof SignatureController>;

export async function addSignatureMessage(request: AddSignatureMessageRequest) {
  const { signatureParams, signatureController, type } = request;
  const [_messageParams, signatureRequest] = signatureParams;
  const { id } = signatureRequest;
  const actionId = id?.toString();
  const functionName = MESSAGE_TYPE_TO_FUNCTION[type] as keyof Pick<
    SignatureController,
    'newUnsignedTypedMessage' | 'newUnsignedPersonalMessage'
  >;

  endTrace({ name: TraceName.Middleware, id: actionId });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Expected 4-5 arguments, but got 2.
  const hash = await signatureController[functionName](...signatureParams);

  endTrace({ name: TraceName.Signature, id: actionId });

  return hash;
}
