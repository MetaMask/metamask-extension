import {
  GenericQuoteRequest,
  QuoteResponseV1,
} from '@metamask/bridge-controller';
import { submitRequestToBackground } from '../background-connection';

export async function fetchQuotes(
  quoteRequest: GenericQuoteRequest,
): Promise<QuoteResponseV1[]> {
  // @ts-expect-error TODO: `fetchQuotes` takes a `featureId` argument, but we
  // don't pass it here. At the moment this is okay because `fetchQuotes` will
  // check its presence at runtime, but we should either update the type for
  // `fetchQuotes` so `featureId` is optional, or we should pass a valid
  // `featureId` here.
  return await submitRequestToBackground('BridgeController:fetchQuotes', [
    quoteRequest,
  ]);
}
