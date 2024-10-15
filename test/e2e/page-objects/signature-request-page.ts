import { Driver } from '../webdriver/driver';

export class SignatureRequestPage {
  constructor(private readonly driver: Driver) {}

  async approveSignatureRequest(): Promise<void> {
    // TODO: Implement the method
    console.log('Approving signature request');
  }
}
