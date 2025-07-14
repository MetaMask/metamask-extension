/* eslint-disable @typescript-eslint/naming-convention */
import { sign } from 'jsonwebtoken';
import { Mockttp } from 'mockttp';
import { secp256k1 } from '@noble/curves/secp256k1';
import { decrypt, encrypt } from '@toruslabs/eccrypto';
import {
  AuthServer,
  METADATA_SET_PATH,
  SSS_BASE_URL_RGX,
  SSS_NODE_KEYPAIRS,
} from './constants';
import {
  ToprfAuthenticateResponse,
  ToprfCommitmentRequestParams,
  ToprfEvalRequestParams,
  ToprfJsonRpcRequestBody,
} from './types';
import { MOCK_AUTH_PUB_KEY, MOCK_KEY_SHARE_DATA } from './data';

const MOCK_JWT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----`;

function generateMockJwtToken(userId: string) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'torus-key-test',
    aud: 'torus-key-test',
    name: userId,
    email: userId,
    scope: 'email',
    iat,
    eat: iat + 120,
  };

  return sign(payload, MOCK_JWT_PRIVATE_KEY, {
    expiresIn: 120,
    algorithm: 'ES256',
  });
}

function padHex(hex: string, length: number = 64) {
  if (hex.length < length) {
    return hex.padStart(length, '0');
  }
  return hex;
}

async function generateBlindedOutput(
  blindedInputX: string,
  blindedInputY: string,
  nodeIndex: number,
  shareCoefficient: bigint = 1n,
) {
  const encShareString =
    MOCK_KEY_SHARE_DATA.share_import_items[nodeIndex - 1].encrypted_share;
  const nodePrivateKey = SSS_NODE_KEYPAIRS[nodeIndex].privKey;

  const { data, metadata } = JSON.parse(encShareString);

  const keyShare = await decrypt(Buffer.from(nodePrivateKey, 'hex'), {
    ciphertext: Buffer.from(data, 'hex'),
    iv: Buffer.from(metadata.iv, 'hex'),
    ephemPublicKey: Buffer.from(metadata.ephemPublicKey, 'hex'),
    mac: Buffer.from(metadata.mac, 'hex'),
  });
  const paddedShare = padHex(Buffer.from(keyShare).toString('hex'));
  const keyShareBN = BigInt(`0x${paddedShare}`);

  const ck = (keyShareBN * shareCoefficient) % secp256k1.CURVE.n;

  const blindedInputPoint = secp256k1.Point.fromAffine({
    x: BigInt(`0x${blindedInputX}`),
    y: BigInt(`0x${blindedInputY}`),
  });

  const blinedOutputPoint = blindedInputPoint.multiply(ck);
  const blindedOutputX = blinedOutputPoint.x.toString(16);
  const blindedOutputY = blinedOutputPoint.y.toString(16);

  return { blindedOutputX, blindedOutputY };
}

// Mock OAuth Service and Authentication Server
export class OAuthMockttpService {
  // Temporary session public key for TOPRF Commitment + Authenticate session
  #sessionPubKey: string = '';

  mockAuthServerToken(overrides?: {
    statusCode?: number;
    json?: Record<string, unknown>;
    userEmail?: string;
  }) {
    const userEmail = overrides?.userEmail || `e2e-user-${crypto.randomUUID()}`;
    const idToken = generateMockJwtToken(userEmail);
    return {
      statusCode: 200,
      json: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        access_token: 'mock-access-token',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        id_token: idToken,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expires_in: 3600,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        refresh_token: 'mock-refresh-token',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        revoke_token: 'mock-revoke-token',
      },
    };
  }

  /**
   * Mock the Auth Server's Request Token response.
   *
   * @param overrides - The overrides for the mock response.
   * @param overrides.statusCode - The status code for the mock response.
   * @param overrides.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   * @returns The mock response for the Request Token endpoint.
   */
  onPostToken(overrides?: { statusCode?: number; userEmail?: string }) {
    return this.mockAuthServerToken(overrides);
  }

  /**
   * Mock the Auth Server's Revoke Token endpoint.
   *
   * @returns The mock response for the Revoke Token endpoint.
   */
  mockAuthServerRevokeToken() {
    return {
      statusCode: 200,
      json: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        refresh_token: 'new-mock-refresh-token',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        revoke_token: 'new-mock-revoke-token',
      },
    };
  }

  onPostRevokeToken() {
    return this.mockAuthServerRevokeToken();
  }

  async onPostToprfCommitment(
    params: ToprfCommitmentRequestParams,
    nodeIndex: number,
  ) {
    const paddedTempPubKeyX = padHex(params.temp_pub_key_x);
    const paddedTempPubKeyY = padHex(params.temp_pub_key_y);
    this.#sessionPubKey = `04${paddedTempPubKeyX}${paddedTempPubKeyY}`;
    return {
      statusCode: 200,
      json: {
        id: 1,
        jsonrpc: '2.0',
        result: {
          signature: 'mock-signature',
          data: 'mock-data',
          node_pub_x: params.temp_pub_key_x,
          node_pub_y: params.temp_pub_key_y,
          node_index: nodeIndex,
        },
      },
    };
  }

  async onPostToprfAuthenticate(nodeIndex: number, isNewUser: boolean = true) {
    const pubKeyHex = Buffer.from(this.#sessionPubKey, 'hex');

    const mockAuthTokenData = JSON.stringify({
      data: 'mock-auth-token-data',
      exp: Date.now(),
    });

    const { ciphertext, ephemPublicKey, mac, iv } = await encrypt(
      pubKeyHex,
      Buffer.from(mockAuthTokenData),
    );

    const mockAuthToken = JSON.stringify({
      data: Buffer.from(ciphertext).toString('hex'),
      metadata: {
        iv: Buffer.from(iv).toString('hex'),
        ephemPublicKey: Buffer.from(ephemPublicKey).toString('hex'),
        mac: Buffer.from(mac).toString('hex'),
      },
    });

    const mockNodePubKey = SSS_NODE_KEYPAIRS[nodeIndex].pubKey;

    const authenticateResult: ToprfAuthenticateResponse = {
      auth_token: mockAuthToken,
      node_index: nodeIndex,
      node_pub_key: mockNodePubKey,
    };

    if (!isNewUser) {
      authenticateResult.key_index = 1;
      authenticateResult.pub_key = MOCK_AUTH_PUB_KEY;
    }

    return {
      statusCode: 200,
      json: {
        id: 1,
        jsonrpc: '2.0',
        result: authenticateResult,
      },
    };
  }

  async onPostToprfStoreKeyShare() {
    return {
      statusCode: 200,
      json: {
        id: 1,
        jsonrpc: '2.0',
        result: {
          message: 'Key share stored successfully',
        },
      },
    };
  }

  async onPostToprfEval(params: ToprfEvalRequestParams, nodeIndex: number) {
    // Generate blinded output with blinded input and mock toprf key share
    const { blindedOutputX, blindedOutputY } = await generateBlindedOutput(
      params.blinded_input_x,
      params.blinded_input_y,
      nodeIndex,
    );

    const evalResult = {
      blinded_output_x: blindedOutputX,
      blinded_output_y: blindedOutputY,
      key_share_index: 1,
      node_index: nodeIndex,
      pub_key: MOCK_AUTH_PUB_KEY,
    };

    return {
      statusCode: 200,
      json: {
        id: 1,
        jsonrpc: '2.0',
        result: evalResult,
      },
    };
  }

  /**
   * Setup the mock server for OAuth Service. (Web Authentication flow + Auth server)
   *
   * @param server - The Mockttp server instance.
   * @param options - The options for the mock server.
   * @param options.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   */
  async setup(
    server: Mockttp,
    options?: {
      userEmail?: string;
    },
  ) {
    server
      .forPost(AuthServer.RequestToken)
      .always()
      .thenCallback(() => {
        return this.onPostToken(options);
      });

    server
      .forPost(AuthServer.RevokeToken)
      .always()
      .thenCallback(() => {
        return this.onPostRevokeToken();
      });

    server
      .forPost(SSS_BASE_URL_RGX)
      .always()
      .thenCallback(async (request) => {
        const nodeIndex = this.#extractNodeIndexFromUrl(request.url);
        const jsonRpcRequestBody = await request.body.getJson();
        const { method, params } =
          jsonRpcRequestBody as ToprfJsonRpcRequestBody<unknown>;

        if (method === 'TOPRFCommitmentRequest') {
          return this.onPostToprfCommitment(
            params as ToprfCommitmentRequestParams,
            nodeIndex,
          );
        } else if (method === 'TOPRFStoreKeyShareRequest') {
          return this.onPostToprfStoreKeyShare();
        } else if (method === 'TOPRFEvalRequest') {
          return this.onPostToprfEval(
            params as ToprfEvalRequestParams,
            nodeIndex,
          );
        }

        const isNewUser = !options?.userEmail;
        return this.onPostToprfAuthenticate(nodeIndex, isNewUser);
      });

    server.forPost(METADATA_SET_PATH).always().thenJson(200, {
      success: true,
      message: 'Metadata set successfully',
    });
  }

  #extractNodeIndexFromUrl(url: string): number {
    const pattern = /node-[1-5]/u;
    const match = url.match(pattern);
    if (!match) {
      throw new Error('Invalid SSS Node URL');
    }
    const nodeIdxStr = match[0].replace('node-', '');
    return parseInt(nodeIdxStr, 10);
  }
}

export function mockWebAuthenticator() {
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = JSON.stringify({
    nonce,
  });
  return {
    generateNonce: () => nonce,
    launchWebAuthFlow: (
      _options: Record<string, unknown>,
      callback?: (url: string) => void,
    ) => {
      return Promise.resolve(
        callback?.(
          `https://mock-redirect-url.com?nonce=${nonce}&state=${state}&code=mock-code`,
        ),
      );
    },
    generateCodeVerifierAndChallenge: () =>
      Promise.resolve({
        codeVerifier: 'mock-code-verifier',
        challenge: 'mock-challenge',
      }),
    getRedirectURL: () => 'https://mock-redirect-url.com',
  };
}
