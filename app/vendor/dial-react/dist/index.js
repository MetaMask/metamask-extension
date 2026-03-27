import { createContext, useMemo, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { DialClient } from '@dial-wtf/client';
import { jsx } from 'react/jsx-runtime';

/* @dial-wtf/react - React bindings for the Dial SDK */

var DialClientContext = createContext(null);
DialClientContext.displayName = "DialClientContext";
var UserDialerContext = createContext(null);
UserDialerContext.displayName = "UserDialerContext";
function DialProvider({
  children,
  ...config
}) {
  const client = useMemo(
    () => new DialClient(config),
    // Stable on the values that actually matter for client construction
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.apiKey, config.network, config.baseUrl, config.timeout, config.debug]
  );
  const [userDialer, setUserDialer] = useState(null);
  const userDialerValue = useMemo(
    () => ({ userDialer, setUserDialer }),
    [userDialer]
  );
  return /* @__PURE__ */ jsx(DialClientContext.Provider, { value: client, children: /* @__PURE__ */ jsx(UserDialerContext.Provider, { value: userDialerValue, children }) });
}
function useDialClient() {
  const client = useContext(DialClientContext);
  if (!client) {
    throw new Error(
      "useDialClient must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  return client;
}
function useAuth() {
  const client = useContext(DialClientContext);
  const userDialerCtx = useContext(UserDialerContext);
  if (!client || !userDialerCtx) {
    throw new Error(
      "useAuth must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  const { userDialer, setUserDialer } = userDialerCtx;
  const [isLoading, setIsLoading] = useState(false);
  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      try {
        const ud = await client.asUser(credentials);
        setUserDialer(ud);
        return ud;
      } finally {
        setIsLoading(false);
      }
    },
    [client, setUserDialer]
  );
  const loginWithWallet = useCallback(
    async (wallet, chainId) => {
      setIsLoading(true);
      try {
        const ud = await client.authenticateWithWallet({ wallet, chainId });
        setUserDialer(ud);
        return ud;
      } finally {
        setIsLoading(false);
      }
    },
    [client, setUserDialer]
  );
  const loginWithSolana = useCallback(
    async (wallet) => {
      setIsLoading(true);
      try {
        const ud = await client.authenticateWithSolana({ wallet });
        setUserDialer(ud);
        return ud;
      } finally {
        setIsLoading(false);
      }
    },
    [client, setUserDialer]
  );
  const logout = useCallback(async () => {
    if (!userDialer) return;
    setIsLoading(true);
    try {
      await userDialer.logout();
      setUserDialer(null);
    } finally {
      setIsLoading(false);
    }
  }, [userDialer, setUserDialer]);
  const session = useMemo(
    () => userDialer ? userDialer.exportSession() : null,
    [userDialer]
  );
  const isAuthenticated = userDialer !== null;
  return { login, loginWithWallet, loginWithSolana, logout, session, isAuthenticated, isLoading };
}
function useCalls() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useCalls must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useCalls requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.calls;
}
function useChat() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useChat must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useChat requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.chat;
}
function useConference() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useConference must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useConference requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.conference;
}
function useVoicemail() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useVoicemail must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useVoicemail requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.voicemail;
}
function useProfile() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useProfile must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useProfile requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.profile;
}
function useContacts() {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useContacts must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  if (!ctx.userDialer) {
    throw new Error(
      "useContacts requires an authenticated session. Call login() via useAuth() before using this hook."
    );
  }
  return ctx.userDialer.contacts;
}
function usePartyLines() {
  const client = useContext(DialClientContext);
  if (!client) {
    throw new Error(
      "usePartyLines must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  return client.partyLines;
}
function useDialEvent(event, callback) {
  const ctx = useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useDialEvent must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const userDialer = ctx.userDialer;
  useEffect(() => {
    if (!userDialer) return;
    const handler = (payload) => {
      callbackRef.current(payload);
    };
    userDialer.on(event, handler);
    return () => {
      userDialer.off(event, handler);
    };
  }, [userDialer, event]);
}

export { DialClientContext, DialProvider, UserDialerContext, useAuth, useCalls, useChat, useConference, useContacts, useDialClient, useDialEvent, usePartyLines, useProfile, useVoicemail };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map