import type {
  OriginalRequest,
  TypedMessageParams,
} from '@metamask/message-manager';
import { endTrace, TraceName } from '../../../../shared/lib/trace';

type SignatureParams = [TypedMessageParams, OriginalRequest];

type AddTypedMessageRequest = {
  signatureParams: SignatureParams;
  newUnsignedTypedMessage: (...args: SignatureParams) => Promise<string>;
};

export async function addTypedMessage(request: AddTypedMessageRequest) {
  const { signatureParams, newUnsignedTypedMessage } = request;
  const [_messageParams, signatureRequest] = signatureParams;
  const { id: actionId } = signatureRequest;

  const hash = await newUnsignedTypedMessage(...signatureParams);

  endTrace({ name: TraceName.Signature, id: actionId?.toString() });

  return hash;
}
