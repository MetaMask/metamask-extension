'use strict';

var react = require('react');
var client = require('@dial-wtf/client');
var jsxRuntime = require('react/jsx-runtime');

/* @dial-wtf/react - React bindings for the Dial SDK */

var DialClientContext = react.createContext(null);
DialClientContext.displayName = "DialClientContext";
var UserDialerContext = react.createContext(null);
UserDialerContext.displayName = "UserDialerContext";
function DialProvider({
  children,
  ...config
}) {
  const client$1 = react.useMemo(
    () => new client.DialClient(config),
    // Stable on the values that actually matter for client construction
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.apiKey, config.network, config.baseUrl, config.timeout, config.debug]
  );
  const [userDialer, setUserDialer] = react.useState(null);
  const userDialerValue = react.useMemo(
    () => ({ userDialer, setUserDialer }),
    [userDialer]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(DialClientContext.Provider, { value: client$1, children: /* @__PURE__ */ jsxRuntime.jsx(UserDialerContext.Provider, { value: userDialerValue, children }) });
}
function useDialClient() {
  const client = react.useContext(DialClientContext);
  if (!client) {
    throw new Error(
      "useDialClient must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  return client;
}
function useAuth() {
  const client = react.useContext(DialClientContext);
  const userDialerCtx = react.useContext(UserDialerContext);
  if (!client || !userDialerCtx) {
    throw new Error(
      "useAuth must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  const { userDialer, setUserDialer } = userDialerCtx;
  const [isLoading, setIsLoading] = react.useState(false);
  const login = react.useCallback(
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
  const loginWithWallet = react.useCallback(
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
  const loginWithSolana = react.useCallback(
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
  const logout = react.useCallback(async () => {
    if (!userDialer) return;
    setIsLoading(true);
    try {
      await userDialer.logout();
      setUserDialer(null);
    } finally {
      setIsLoading(false);
    }
  }, [userDialer, setUserDialer]);
  const session = react.useMemo(
    () => userDialer ? userDialer.exportSession() : null,
    [userDialer]
  );
  const isAuthenticated = userDialer !== null;
  return { login, loginWithWallet, loginWithSolana, logout, session, isAuthenticated, isLoading };
}
function useCalls() {
  const ctx = react.useContext(UserDialerContext);
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
  const ctx = react.useContext(UserDialerContext);
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
  const ctx = react.useContext(UserDialerContext);
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
  const ctx = react.useContext(UserDialerContext);
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
  const ctx = react.useContext(UserDialerContext);
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
  const ctx = react.useContext(UserDialerContext);
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
  const client = react.useContext(DialClientContext);
  if (!client) {
    throw new Error(
      "usePartyLines must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  return client.partyLines;
}
function useDialEvent(event, callback) {
  const ctx = react.useContext(UserDialerContext);
  if (!ctx) {
    throw new Error(
      "useDialEvent must be used within a <DialProvider>. Wrap your component tree with <DialProvider> to provide the Dial SDK context."
    );
  }
  const callbackRef = react.useRef(callback);
  callbackRef.current = callback;
  const userDialer = ctx.userDialer;
  react.useEffect(() => {
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

exports.DialClientContext = DialClientContext;
exports.DialProvider = DialProvider;
exports.UserDialerContext = UserDialerContext;
exports.useAuth = useAuth;
exports.useCalls = useCalls;
exports.useChat = useChat;
exports.useConference = useConference;
exports.useContacts = useContacts;
exports.useDialClient = useDialClient;
exports.useDialEvent = useDialEvent;
exports.usePartyLines = usePartyLines;
exports.useProfile = useProfile;
exports.useVoicemail = useVoicemail;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map