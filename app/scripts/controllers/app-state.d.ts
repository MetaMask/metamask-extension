import { SecurityAlertResponse } from '../lib/ppom/types';

export type AppStateController = {
  addSignatureSecurityAlertResponse(
    securityAlertResponse: SecurityAlertResponse,
  ): void;
  getUnlockPromise(shouldShowUnlockRequest: boolean): Promise<void>;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  setCustodianDeepLink({
    fromAddress,
    custodyId,
  }: {
    fromAddress: string;
    custodyId: string;
  }): void;
  showInteractiveReplacementTokenBanner({
    oldRefreshToken,
    url,
  }: {
    oldRefreshToken: string;
    url: string;
  }): void;
  ///: END:ONLY_INCLUDE_IF
};
