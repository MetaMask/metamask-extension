import * as URI from 'uri-js';

import { getUsableUrls } from './chainlist-network-picker';

export type ChainlistRpcEntry = string | { url?: string };

export type ChainlistRpcChain = {
  chainId: string | number;
  rpc?: ChainlistRpcEntry[];
};

export type ChainlistRpcSuggestion = {
  url: string;
  nickname: string;
};

const readRpcUrl = (entry: ChainlistRpcEntry): string | undefined =>
  typeof entry === 'string' ? entry : entry.url;

/**
 * Nickname for a Chainlist RPC. Chainlist has no RPC name, so this is the host
 * with the scheme and path removed.
 *
 * @param rpcUrl - RPC URL to label.
 * @returns Host name, or undefined when the URL cannot be parsed.
 */
export const getRpcNickname = (rpcUrl: string): string | undefined => {
  try {
    return new URL(rpcUrl).hostname;
  } catch {
    return undefined;
  }
};

const toDecimalChainId = (chainId: string): string | undefined => {
  const trimmedChainId = chainId.trim();
  if (!trimmedChainId) {
    return undefined;
  }

  if (/^0x[0-9a-f]+$/iu.test(trimmedChainId)) {
    return Number.parseInt(trimmedChainId, 16).toString(10);
  }

  if (/^[0-9]+$/u.test(trimmedChainId)) {
    return String(Number(trimmedChainId));
  }

  return undefined;
};

const isSameRpcUrl = (left: string, right: string): boolean => {
  try {
    return URI.equal(left, right);
  } catch {
    return left === right;
  }
};

/**
 * Chainlist RPC URLs for one chain, excluding unusable and already-added URLs.
 *
 * @param options - Chain list, the form chain ID, URLs already on the network, and the typed query.
 * @param options.chains - Chainlist chains.
 * @param options.chainId - Chain ID from the add or edit network form.
 * @param options.existingRpcUrls - RPC URLs already saved for this network.
 * @param options.query - Text currently in the RPC URL field.
 * @returns Suggestions whose chain matches and whose URL or host matches the query.
 */
export const getChainlistRpcSuggestions = ({
  chains,
  chainId,
  existingRpcUrls = [],
  query = '',
}: {
  chains: ChainlistRpcChain[];
  chainId?: string;
  existingRpcUrls?: string[];
  query?: string;
}): ChainlistRpcSuggestion[] => {
  const decimalChainId = chainId ? toDecimalChainId(chainId) : undefined;
  if (!decimalChainId) {
    return [];
  }

  const chain = chains.find(
    (candidate) => String(candidate.chainId) === decimalChainId,
  );
  if (!chain) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const suggestions: ChainlistRpcSuggestion[] = [];
  const seenUrls = new Set<string>();

  getUsableUrls(
    (chain.rpc ?? [])
      .map(readRpcUrl)
      .filter((url): url is string => Boolean(url)),
  ).forEach((url) => {
    const nickname = getRpcNickname(url);
    if (!nickname || seenUrls.has(url)) {
      return;
    }

    if (existingRpcUrls.some((existingUrl) => isSameRpcUrl(existingUrl, url))) {
      return;
    }

    if (
      normalizedQuery &&
      !url.toLowerCase().includes(normalizedQuery) &&
      !nickname.toLowerCase().includes(normalizedQuery)
    ) {
      return;
    }

    seenUrls.add(url);
    suggestions.push({ url, nickname });
  });

  return suggestions;
};
