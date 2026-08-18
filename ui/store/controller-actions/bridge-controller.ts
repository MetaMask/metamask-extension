import {
  type FeatureId,
  type GenericQuoteRequest,
  type QuoteResponseV1,
} from '@metamask/bridge-controller';
import { submitRequestToBackground } from '../background-connection';

export async function fetchQuotes(
  quoteRequest: GenericQuoteRequest,
  featureId?: FeatureId,
): Promise<QuoteResponseV1[]> {
  return await submitRequestToBackground('fetchQuotes', [
    quoteRequest,
    featureId,
  ]);
}
