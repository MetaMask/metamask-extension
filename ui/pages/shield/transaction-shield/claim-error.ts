import { SubmitClaimErrorResponse } from './types';

export class SubmitClaimError extends Error {
  data?: SubmitClaimErrorResponse;

  constructor(message: string, data?: SubmitClaimErrorResponse) {
    super(message);
    this.name = 'SubmitClaimError';
    this.data = data;
  }
}
