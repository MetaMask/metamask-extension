/* eslint-disable @typescript-eslint/naming-convention */
import { sign } from 'jsonwebtoken';
import { CompletedRequest, Mockttp } from 'mockttp';
import { gcm } from '@noble/ciphers/aes';
import { managedNonce } from '@noble/ciphers/webcrypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { decrypt, encrypt } from '@toruslabs/eccrypto';
import { SecretType } from '@metamask/seedless-onboarding-controller';
import { bytesToBase64, stringToBytes } from '@metamask/utils';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { E2E_SRP } from '../../fixtures/default-fixture';
import {
  AuthServer,
  MetadataService,
  PasswordChangeItemId,
  SSSBaseUrlRgx,
  SSSNodeKeyPairs,
} from './constants';
import {
  ToprfAuthenticateResponse,
  ToprfCommitmentRequestParams,
  ToprfEvalRequestParams,
  ToprfJsonRpcRequestBody,
  ToprfStoreKeyShareRequestParams,
} from './types';
import {
  MockAuthPubKey,
  InitialMockEncryptionKey,
  MockKeyShareData,
  MockJwtPrivateKey,
  NewMockPwdEncryptionKeyAfterPasswordChange,
  MockAuthPubKey2,
} from './data';

/**
 * Generate a mock JWT token for OAuth Service.
 *
 * @param userId - The user ID.
 * @param expiresIn - The expiration time in seconds.
 * @param mode - Indicates if the token is a newly issued token or a refreshed token.
 * @returns The mock JWT token.
 */
function generateMockJwtToken(
  userId: string,
  expiresIn: number = 120,
  mode: 'new' | 'refreshed' = 'new',
) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'torus-key-test',
    aud: 'torus-key-test',
    name: userId,
    email: userId,
    scope: 'email',
    iat,
    mode, // Note: The actual tokens issued/refreshed do not have this `mode` field, it's only used for testing purposes to differentiate between newly issued and refreshed tokens.
    eat: iat + expiresIn,
  };

  return sign(payload, MockJwtPrivateKey, {
    expiresIn,
    algorithm: 'ES256',
  });
}

function padHex(hex: string, length: number = 64) {
  if (hex.length < length) {
    return hex.padStart(length, '0');
  }
  return hex;
}

/**
 * Generate a mock blinded output for TOPRF Eval response.
 *
 * @param blindedInputX - The x coordinate of the blinded input from TOPRF Eval request.
 * @param blindedInputY - The y coordinate of the blinded input from TOPRF Eval request.
 * @param nodeIndex - The index of the node.
 * @param keyShareData - The key share data to use for the blinded output.
 * @param shareCoefficient - The share coefficient from TOPRF Eval request.
 * @returns The blinded output.
 */
async function generateBlindedOutput(
  blindedInputX: string,
  blindedInputY: string,
  nodeIndex: number,
  keyShareData: ToprfStoreKeyShareRequestParams = MockKeyShareData,
  shareCoefficient: bigint = 1n,
) {
  const encShareString =
    keyShareData.share_import_items[nodeIndex - 1].encrypted_share;
  const nodePrivateKey = SSSNodeKeyPairs[nodeIndex].privKey;

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

/**
 * Generate a mock encrypted secret data for Metadata Service.
 *
 * @param secretDataArr - The array of secret data.
 * @returns The encrypted secret data.
 */
async function generateEncryptedSecretData(
  secretDataArr: { data: Uint8Array; timestamp?: number; type?: SecretType }[],
) {
  const encData = secretDataArr.map((secretData) => {
    const b64SecretData = Buffer.from(secretData.data).toString('base64');
    const secretMetadata = JSON.stringify({
      data: b64SecretData,
      timestamp: secretData.timestamp ?? 1752564090656,
      type: secretData.type,
    });
    const secretBytes = stringToBytes(secretMetadata);

    const aes = managedNonce(gcm)(InitialMockEncryptionKey);
    const cipherText = aes.encrypt(secretBytes);
    return bytesToBase64(cipherText);
  });
  return encData;
}

/**
 * Generate a mock encrypted password change item for Metadata Service.
 * This is to mock the password change operation for social login flow.
 *
 * @returns The encrypted password change item.
 */
async function generateEncryptedPasswordChangeItem() {
  const pwdChangeItem = {
    itemId: PasswordChangeItemId,
    data: utf8ToBytes(
      JSON.stringify({
        pw: 'newPassword',
        encKey: bytesToHex(NewMockPwdEncryptionKeyAfterPasswordChange),
        authKeyPair: {
          sk: '1',
          pk: 'deadbeef',
        },
      }),
    ),
  };

  const aes = managedNonce(gcm)(NewMockPwdEncryptionKeyAfterPasswordChange);
  const cipherText = aes.encrypt(pwdChangeItem.data);
  const encryptedPwdChangeItem = bytesToBase64(cipherText);

  return encryptedPwdChangeItem;
}

// Mock OAuth Service and Authentication Server
export class OAuthMockttpService {
  // Temporary session public key for TOPRF Commitment + Authenticate session
  #sessionPubKey: string = '';

  #latestAuthPubKey: string = MockAuthPubKey;

  #numbOfRequestTokensCalls: number = 0;

  async mockAuthServerToken(
    request: CompletedRequest,
    overrides?: {
      statusCode?: number;
      json?: Record<string, unknown>;
      userEmail?: string;
      passwordOutdated?: boolean;
      throwAuthenticationErrorAtUnlock?: boolean;
      forceTokenExpiration?: boolean;
    },
  ) {
    const userEmail = overrides?.userEmail || `e2e-user-${crypto.randomUUID()}`;
    const jsonRpcRequestBody = await request.body.getJson();
    // eslint-disable-next-line camelcase
    const { grant_type: grantType } = jsonRpcRequestBody as {
      grant_type: string;
    };

    // Check whether the request is for refresh token or social login authentication based on the grant type
    // We wanna generate a different token payload for the access token based on the grant type, for example:
    // - For social login authentication, the access token should have a `mode` field with value `new`
    // - For refresh token, the access token should have a `mode` field with value `refreshed`
    const isRefreshTokenGrantType = grantType === 'refresh_token';
    const forceTokenExpiration = isRefreshTokenGrantType
      ? false
      : overrides?.forceTokenExpiration;
    const expiresIn = forceTokenExpiration ? 0 : 120; // setting a very short expiration time for testing purposes if forceTokenExpiration is true

    // Generate the mock JWT tokens for the request
    const idToken = generateMockJwtToken(userEmail, expiresIn);
    const accessToken = generateMockJwtToken(
      userEmail,
      expiresIn,
      isRefreshTokenGrantType ? 'refreshed' : 'new',
    );

    // keep track of the number of request tokens calls
    this.#numbOfRequestTokensCalls += 1;

    if (
      // on the second call, (assuming it's for unlock) we throw an authentication error when passwordOutdated & throwAuthenticationErrorAtUnlock are true
      this.#numbOfRequestTokensCalls === 2 &&
      overrides?.throwAuthenticationErrorAtUnlock &&
      overrides?.passwordOutdated
    ) {
      return {
        statusCode: 500,
        json: {
          message: 'Internal server error',
        },
      };
    }

    return {
      statusCode: 200,
      json: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        access_token: accessToken,
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        metadata_access_token: idToken,
      },
    };
  }

  /**
   * Mock the Auth Server's Request Token response.
   *
   * @param request - The Mockttp request object.
   * @param overrides - The overrides for the mock response.
   * @param overrides.statusCode - The status code for the mock response.
   * @param overrides.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   * @param overrides.passwordOutdated - Whether the password is outdated. If not provided, false will be used.
   * @param overrides.throwAuthenticationErrorAtUnlock - Whether to throw an authentication error at unlock. If not provided, false will be used.
   * @param overrides.forceTokenExpiration - Whether to force the token expiration. If not provided, false will be used.
   * @returns The mock response for the Request Token endpoint.
   */
  onPostToken(
    request: CompletedRequest,
    overrides?: {
      statusCode?: number;
      userEmail?: string;
      passwordOutdated?: boolean;
      throwAuthenticationErrorAtUnlock?: boolean;
      forceTokenExpiration?: boolean;
    },
  ) {
    return this.mockAuthServerToken(request, overrides);
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
        message: 'Token revoked successfully',
      },
    };
  }

  /**
   * Mock the Auth Server's Renew Refresh Token endpoint.
   *
   * @returns The mock response for the Renew Refresh Token endpoint.
   */
  mockAuthServerRenewRefreshToken() {
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

  onPostRenewRefreshToken() {
    return this.mockAuthServerRenewRefreshToken();
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
    const mockNodePubKey = SSSNodeKeyPairs[nodeIndex].pubKey;
    const mockAuthToken = await this.#generateMockAuthToken();

    const authenticateResult: ToprfAuthenticateResponse = {
      auth_token: mockAuthToken,
      node_index: nodeIndex,
      node_pub_key: mockNodePubKey,
    };

    if (!isNewUser) {
      authenticateResult.key_index = 1;
      authenticateResult.pub_key = MockAuthPubKey;
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
      pub_key: MockAuthPubKey,
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

  async onPostMetadataGet() {
    const seedPhraseAsBuffer = Buffer.from(E2E_SRP, 'utf8');
    const indices = seedPhraseAsBuffer
      .toString()
      .split(' ')
      .map((word: string) => wordlist.indexOf(word));
    const seedPhraseBytes = new Uint8Array(new Uint16Array(indices).buffer);

    const secretData = [
      {
        data: seedPhraseBytes,
        timestamp: Date.now(),
        type: SecretType.Mnemonic,
      },
    ];

    const encryptedSecretData = await generateEncryptedSecretData(secretData);
    const encryptedPwdChangeItem = await generateEncryptedPasswordChangeItem();
    encryptedSecretData.push(encryptedPwdChangeItem);

    return {
      statusCode: 200,
      json: {
        success: true,
        data: encryptedSecretData,
        ids: ['', PasswordChangeItemId],
      },
    };
  }

  /**
   * Setup the mock server for OAuth Service. (Web Authentication flow + Auth server)
   *
   * @param server - The Mockttp server instance.
   * @param options - The options for the mock server.
   * @param options.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   * @param options.passwordOutdated - Whether the password is outdated. If not provided, false will be used.
   * @param options.throwAuthenticationErrorAtUnlock - Whether to throw an authentication error at unlock. If not provided, false will be used.
   * @param options.forceTokenExpiration - Whether to force the token expiration. If not provided, false will be used.
   */
  async setup(
    server: Mockttp,
    options?: {
      userEmail?: string;
      passwordOutdated?: boolean;
      throwAuthenticationErrorAtUnlock?: boolean;
      forceTokenExpiration?: boolean;
    },
  ) {
    const authServerMockResponses = [
      await server
        .forPost(AuthServer.RequestToken)
        .always()
        .thenCallback(async (request) => {
          return this.onPostToken(request, options);
        }),

      await server
        .forPost(AuthServer.RevokeToken)
        .always()
        .thenCallback(() => {
          return this.onPostRevokeToken();
        }),

      await server
        .forGet(AuthServer.GetMarketingOptInStatus)
        .always()
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              is_opt_in: true,
            },
          };
        }),
      await server
        .forPost(AuthServer.GetMarketingOptInStatus)
        .always()
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              is_opt_in: true,
            },
          };
        }),

      await server
        .forPost(AuthServer.RenewRefreshToken)
        .always()
        .thenCallback(() => {
          return this.onPostRenewRefreshToken();
        }),
    ];

    // Intercept the TOPRF requests (Authentication, KeyGen, Eval, etc.) and mock the responses
    const toprfMockResponses = await server
      .forPost(SSSBaseUrlRgx)
      .always()
      .thenCallback(async (request) => {
        return this.#handleToprfMockResponses(request, options);
      });

    // Intercept the Metadata requests and mock the responses
    const metadataMockResponses =
      await this.#handleMetadataMockResponses(server);

    return [
      ...authServerMockResponses,
      ...metadataMockResponses,
      toprfMockResponses,
    ];
  }

  /**
   * Handle the mock responses for the TOPRF requests.
   *
   * @param request - The request object.
   * @param options - The options for the mock responses.
   * @param options.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   * @param options.passwordOutdated - Whether the password is outdated. If not provided, false will be used.
   * @param options.throwAuthenticationErrorAtUnlock - Whether to throw an authentication error at unlock. If not provided, false will be used.
   */
  async #handleToprfMockResponses(
    request: CompletedRequest,
    options?: {
      userEmail?: string;
      passwordOutdated?: boolean;
      throwAuthenticationErrorAtUnlock?: boolean;
    },
  ) {
    const nodeIndex = this.#extractNodeIndexFromUrl(request.url);
    const jsonRpcRequestBody = await request.body.getJson();
    const { method, params } =
      jsonRpcRequestBody as ToprfJsonRpcRequestBody<unknown>;

    if (method === 'TOPRFCommitmentRequest') {
      // Mock the TOPRF Commitment request
      return this.onPostToprfCommitment(
        params as ToprfCommitmentRequestParams,
        nodeIndex,
      );
    } else if (method === 'TOPRFStoreKeyShareRequest') {
      this.#latestAuthPubKey = (
        params as ToprfStoreKeyShareRequestParams
      ).pub_key;
      // Mock the TOPRF Store Key Share request
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
    } else if (method === 'TOPRFEvalRequest') {
      // Mock the TOPRF Eval request (during Social login rehydrate or import wallet)
      return this.onPostToprfEval(params as ToprfEvalRequestParams, nodeIndex);
    } else if (method === 'TOPRFResetRateLimitRequest') {
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
    } else if (method === 'TOPRFGetPubKeyRequest') {
      let pubKey = this.#latestAuthPubKey;
      if (options?.throwAuthenticationErrorAtUnlock) {
        // To throw the authentication error at unlock, we need to enforce the password outdated with different pub key
        pubKey = MockAuthPubKey2;
      } else if (options?.passwordOutdated) {
        pubKey = MockAuthPubKey;
      }
      return {
        statusCode: 200,
        json: {
          id: 1,
          jsonrpc: '2.0',
          result: {
            pub_key: pubKey,
            key_index: 1,
            node_index: nodeIndex,
          },
        },
      };
    }

    const isNewUser = !options?.userEmail;
    return this.onPostToprfAuthenticate(nodeIndex, isNewUser);
  }

  async #handleMetadataMockResponses(server: Mockttp) {
    return [
      await server.forPost(MetadataService.Set).always().thenJson(200, {
        success: true,
        message: 'Metadata set successfully',
      }),
      await server
        .forPost(MetadataService.Get)
        .always()
        .thenCallback(async (_request) => {
          return this.onPostMetadataGet();
        }),
      await server
        .forPost(MetadataService.AcquireLock)
        .always()
        .thenCallback(async (_request) => {
          return {
            statusCode: 200,
            json: {
              success: true,
              status: 1,
              id: 'MOCK_LOCK_ID',
            },
          };
        }),
      await server
        .forPost(MetadataService.ReleaseLock)
        .always()
        .thenCallback(async (_request) => {
          return {
            statusCode: 200,
            json: {
              success: true,
              status: 1,
            },
          };
        }),
      await server
        .forPost(MetadataService.BatchSet)
        .always()
        .thenCallback(async (_request) => {
          return {
            statusCode: 200,
            json: {
              success: true,
              message: 'Metadata set successfully',
            },
          };
        }),
    ];
  }

  /**
   * Generate a mock authentication token for TOPRF Authenticate request.
   *
   * @returns The mock authentication token.
   */
  async #generateMockAuthToken() {
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

    return mockAuthToken;
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
