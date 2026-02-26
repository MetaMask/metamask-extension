import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';
import { submitRequestToBackground } from '../background-connection';

export async function fetchQuotes(
  quoteRequest: GenericQuoteRequest,
): Promise<QuoteResponse[]> {
  return await submitRequestToBackground('fetchQuotes', [quoteRequest]);
}
