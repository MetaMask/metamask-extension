import React, { createContext, FunctionComponent } from 'react';
import type { Json } from '@metamask/utils';
import { BackgroundRpcClient } from '../store/background-connection';
import { DATA_SERVICES } from '../../shared/constants/data-services';

// TODO: Dedupe these types
export type Key = [string, ...Json[]];

export type CacheEntry = {
  status: 'pending' | 'error' | 'success';
  data?: Json;
  error?: unknown;
  promise?: Promise<Json>;
  dataUpdated?: number;
};

function hashKey(key: Key) {
  return JSON.stringify(key);
}

function getServiceFromKey(key: Key) {
  return key[0].split(':')[0];
}

export type DataServiceContextType = {};

export const DataServiceContext = createContext<DataServiceContextType | null>(
  null,
);

type SubscriptionCallback = (entry: CacheEntry) => void;

export const DataServiceProvider: FunctionComponent<{
  backgroundConnection: BackgroundRpcClient;
}> = ({ backgroundConnection, children }) => {
  const subscriptions = new Map<string, Set<SubscriptionCallback>>();

  const cache = new Map<string, CacheEntry>();

  function updateCache(hash: string, entry: CacheEntry) {
    cache.set(hash, entry);

    const subscribers = subscriptions.get(hash)!;
    subscribers.forEach((subscriber) => subscriber(entry));
  }

  backgroundConnection.onNotification(async (data) => {
    const { method, params } = data;

    if (!method.endsWith('cacheUpdate')) {
      return;
    }

    const { hash, state } = params[0];
    if (subscriptions.has(hash)) {
      console.log('Hydrated cache', hash, state);
      updateCache(hash, state);
    }
  });

  async function sendBackgroundRequest(method: string, params: Json[]) {
    try {
      const result = await backgroundConnection[method](...params);

      console.log(method, params, result);

      return result;
    } catch (error) {
      console.error(method, params, error);
    }
  }

  async function fetchKey(key: Key, pageParam?: Json = null) {
    const potentialAction = key[0];

    if (!DATA_SERVICES.includes(potentialAction?.split(':')?.[0])) {
      throw new Error('Queries must use data service actions.');
    }

    return await sendBackgroundRequest(potentialAction, [key, pageParam]);
  }

  async function subscribe(key: Key, callback: SubscriptionCallback) {
    const hash = hashKey(key);

    if (!subscriptions.has(hash)) {
      subscriptions.set(hash, new Set());
    }

    const subscribers = subscriptions.get(hash)!;

    subscribers.add(callback);

    if (subscribers.size > 1) {
      return;
    }

    const service = getServiceFromKey(key);
    const state = await sendBackgroundRequest(`${service}:subscribe`, [key]);

    cache.set(hash, state);

    return state;
  }

  async function unsubscribe(key: Key, callback: SubscriptionCallback) {
    const hash = hashKey(key);

    const subscribers = subscriptions.get(hash);

    if (!subscribers) {
      return;
    }

    subscribers.delete(callback);

    if (subscribers.size > 0) {
      return;
    }

    const service = getServiceFromKey(key);
    const state = await sendBackgroundRequest(`${service}:unsubscribe`, [key]);

    cache.set(hash, state);

    return state;
  }

  function get(key: Key) {
    return cache.get(hashKey(key));
  }

  return (
    <DataServiceContext.Provider
      value={{ fetchKey, subscribe, unsubscribe, get }}
    >
      {children}
    </DataServiceContext.Provider>
  );
};
