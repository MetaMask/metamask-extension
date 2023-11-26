import { type BrowserContext } from '@playwright/test';

export class OAuthAPIClient {
  readonly context: BrowserContext;

  readonly baseUrl: string;

  constructor(context: BrowserContext) {
    this.context = context;
    this.baseUrl = process.env.MMI_E2E_AUTH0_TOKEN_URL as string;
  }

  async getToken() {
    if (process.env.AUTH0_ACCESS_TOKEN) {
      return process.env.AUTH0_ACCESS_TOKEN;
    }
    const response = await this.context.request.post(this.baseUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        client_id: process.env.MMI_E2E_AUTHO_CLIENT_ID,
        client_secret: process.env.MMI_E2E_AUTHO_SECRET,
        audience: process.env.MMI_E2E_JUPITER_BASE_URL,
        grant_type: 'client_credentials',
      },
    });
    const json = await response.json();
    if (json.access_token) {
      return json.access_token;
    }
    throw new Error(JSON.stringify(json));
  }
}
