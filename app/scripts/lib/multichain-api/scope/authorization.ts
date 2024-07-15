import { NetworkClientId } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { validateScopes } from './validation';
import { ScopesObject } from './scope';
import { flattenMergeScopes } from './transform';
import { assertScopesSupported } from './assert';

export type Caip25Authorization =
  | {
      requiredScopes: ScopesObject;
      optionalScopes?: ScopesObject;
      sessionProperties?: Record<string, unknown>;
    }
  | ({
      requiredScopes?: ScopesObject;
      optionalScopes: ScopesObject;
    } & {
      sessionProperties?: Record<string, unknown>;
    });

// TODO: Awful name. I think the other helpers need to be renamed as well
export const processScopes = (
  requiredScopes: ScopesObject,
  optionalScopes: ScopesObject,
  {
    findNetworkClientIdByChainId,
  }: {
    findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
  },
) => {
  const { validRequiredScopes, validOptionalScopes } = validateScopes(
    requiredScopes,
    optionalScopes,
  );

  // TODO: determine is merging is a valid strategy
  const flattenedRequiredScopes = flattenMergeScopes(validRequiredScopes);
  const flattenedOptionalScopes = flattenMergeScopes(validOptionalScopes);

  assertScopesSupported(flattenedRequiredScopes, {
    findNetworkClientIdByChainId,
  });
  assertScopesSupported(flattenedOptionalScopes, {
    findNetworkClientIdByChainId,
  });

  return {
    flattenedRequiredScopes,
    flattenedOptionalScopes,
  };
};
