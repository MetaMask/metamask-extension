import {
  GenericQuoteRequest,
  QuoteResponseV1,
} from '@metamask/bridge-controller';
import { submitRequestToBackground } from '../background-connection';

export async function fetchQuotes(
  quoteRequest: GenericQuoteRequest,
): Promise<QuoteResponseV1[]> {
  return await submitRequestToBackground('fetchQuotes', [quoteRequest]);
}
