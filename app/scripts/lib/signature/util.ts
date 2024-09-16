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

async function handleSignature(
  signatureParams: SignatureParams,
  signatureController: SignatureController,
  functionName: keyof SignatureController,
) {
  const [_messageParams, signatureRequest] = signatureParams;
  const { id } = signatureRequest;
  const actionId = id?.toString();

  endTrace({ name: TraceName.Middleware, id: actionId });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Expected 4-5 arguments, but got 2.
  const hash = await signatureController[functionName](...signatureParams);

  endTrace({ name: TraceName.Signature, id: actionId });

  return hash;
}

export async function addTypedMessage(
  signatureParams: SignatureParams,
  signatureController: SignatureController,
) {
  return handleSignature(
    signatureParams,
    signatureController,
    'newUnsignedTypedMessage',
  );
}

export async function addPersonalMessage(
  signatureParams: SignatureParams,
  signatureController: SignatureController,
) {
  return handleSignature(
    signatureParams,
    signatureController,
    'newUnsignedPersonalMessage',
  );
}
