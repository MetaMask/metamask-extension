import type {
  OriginalRequest,
  SignatureController,
  MessageParamsTyped,
  MessageParamsPersonal,
} from '@metamask/signature-controller';
import type {
  Json,
  JsonRpcRequest,
  MiddlewareContext,
} from '@metamask/json-rpc-engine/v2';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

export type SignatureParams = [
  MessageParamsTyped | MessageParamsPersonal,
  JsonRpcRequest,
  MiddlewareContext,
  string?, // version if typed message
];

export type MessageType = keyof typeof MESSAGE_TYPE;

export type AddSignatureMessageRequest = {
  signatureParams: SignatureParams;
  signatureController: SignatureController;
};

async function handleSignature(
  signatureParams: SignatureParams,
  signatureController: SignatureController,
  functionName: keyof SignatureController,
) {
  const [messageParams, signatureRequest, requestContext, version] =
    signatureParams;
  const { id, method, params } = signatureRequest;
  const originalRequest = {
    // @ts-expect-error - Will resolve on package update
    id,
    method,
    params: params as string[],
    origin: requestContext.get('origin') as string,
    networkClientId: requestContext.get('networkClientId') as string,
    securityAlertResponse: requestContext.get(
      'securityAlertResponse',
    ) as Record<string, Json>,
  } satisfies OriginalRequest;

  const actionId = id?.toString();
  endTrace({ name: TraceName.Middleware, id: actionId });

  // @ts-expect-error - Bludgeoning the types to make a polymorphic call
  const signature = await signatureController[functionName](
    messageParams,
    originalRequest,
    version,
  );

  endTrace({ name: TraceName.Signature, id: actionId });

  return signature;
}

export async function addTypedMessage({
  signatureParams,
  signatureController,
}: AddSignatureMessageRequest) {
  return handleSignature(
    signatureParams,
    signatureController,
    'newUnsignedTypedMessage',
  );
}

export async function addPersonalMessage({
  signatureParams,
  signatureController,
}: AddSignatureMessageRequest) {
  return handleSignature(
    signatureParams,
    signatureController,
    'newUnsignedPersonalMessage',
  );
}
