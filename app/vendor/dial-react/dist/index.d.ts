import * as React from 'react';
import React__default from 'react';
import { DialClientConfig, AuthCredentials, SessionData, DialEventType, EventListener } from '@dial-wtf/core';
import { DialClient, UserDialer, CallsService, ChatService, ConferenceService, VoicemailService, ProfileService, ContactsBook, PartyLinesService } from '@dial-wtf/client';

/**
 * @file provider.tsx
 * @description DialProvider — top-level context provider for the Dial SDK.
 * @layer React Context
 */

/**
 * Props for the DialProvider component.
 */
interface DialProviderProps extends DialClientConfig {
    children: React__default.ReactNode;
}
/**
 * DialProvider — wraps your app with Dial SDK context.
 *
 * Creates a DialClient from the provided config and makes it available
 * to all child components via useDialClient() and related hooks.
 *
 * @example
 * ```tsx
 * import { DialProvider } from '@dial-wtf/react';
 *
 * function App() {
 *   return (
 *     <DialProvider apiKey="pk_live_..." network="alpha">
 *       <MyApp />
 *     </DialProvider>
 *   );
 * }
 * ```
 */
declare function DialProvider({ children, ...config }: DialProviderProps): React__default.JSX.Element;

/**
 * Context providing the DialClient instance.
 *
 * Set by DialProvider — consumers access it via useDialClient().
 */
declare const DialClientContext: React.Context<DialClient | null>;
/**
 * Context providing the authenticated UserDialer instance.
 *
 * Null until the user calls login() / loginWithWallet() / loginWithSolana().
 * Cleared on logout().
 */
declare const UserDialerContext: React.Context<{
    userDialer: UserDialer | null;
    setUserDialer: (ud: UserDialer | null) => void;
} | null>;

/**
 * @file use-dial-client.ts
 * @description Hook to access the DialClient instance from context.
 * @layer React Hooks
 */

/**
 * Access the DialClient instance from the nearest DialProvider.
 *
 * @throws Error if used outside of a DialProvider.
 *
 * @example
 * ```tsx
 * const dial = useDialClient();
 * const rooms = await dial.partyLines.getActive();
 * ```
 */
declare function useDialClient(): DialClient;

/**
 * @file use-auth.ts
 * @description Authentication hook — login, logout, and session state.
 * @layer React Hooks
 */

/**
 * Return type for the useAuth hook.
 */
interface UseAuthReturn {
    /** Authenticate with SIWE / SIWS credentials and create a UserDialer session. */
    login: (credentials: AuthCredentials) => Promise<UserDialer>;
    /** Authenticate using an EIP-1193 / ethers-compatible wallet signer. */
    loginWithWallet: (wallet: {
        getAddress: () => Promise<string>;
        signMessage: (message: string) => Promise<string>;
    }, chainId: number) => Promise<UserDialer>;
    /** Authenticate using a Solana wallet adapter. */
    loginWithSolana: (wallet: {
        publicKey: {
            toBase58: () => string;
        };
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    }) => Promise<UserDialer>;
    /** Logout and clear the authenticated session. */
    logout: () => Promise<void>;
    /** The current session data, or null if unauthenticated. */
    session: SessionData | null;
    /** Whether the user is currently authenticated. */
    isAuthenticated: boolean;
    /** Whether a login or logout operation is in progress. */
    isLoading: boolean;
}
/**
 * Manage authentication state for the Dial SDK.
 *
 * @throws Error if used outside of a DialProvider.
 *
 * @example
 * ```tsx
 * const { login, logout, isAuthenticated, session } = useAuth();
 *
 * // Login with SIWE
 * await login({ siwe: { message, signature } });
 *
 * // Or with a wallet
 * await loginWithWallet(signer, 1);
 * ```
 */
declare function useAuth(): UseAuthReturn;

/**
 * @file use-calls.ts
 * @description Hook to access the CallsService from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the calls service for wallet-to-wallet audio/video calling.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const calls = useCalls();
 * const call = await calls.start({ to: '0x...', type: 'video' });
 * ```
 */
declare function useCalls(): CallsService;

/**
 * @file use-chat.ts
 * @description Hook to access the ChatService from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the chat service for E2EE DMs and group messaging.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const chat = useChat();
 * await chat.send({ to: '0x...', content: 'Hello!' });
 * ```
 */
declare function useChat(): ChatService;

/**
 * @file use-conference.ts
 * @description Hook to access the ConferenceService from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the conference service for video conferencing and room management.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const conference = useConference();
 * const room = await conference.create({ name: 'Standup', maxParticipants: 10 });
 * ```
 */
declare function useConference(): ConferenceService;

/**
 * @file use-voicemail.ts
 * @description Hook to access the VoicemailService from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the voicemail service for managing voicemails.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const voicemail = useVoicemail();
 * const messages = await voicemail.getAll();
 * ```
 */
declare function useVoicemail(): VoicemailService;

/**
 * @file use-profile.ts
 * @description Hook to access the ProfileService from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the profile service for managing user profiles.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const profile = useProfile();
 * const me = await profile.get();
 * ```
 */
declare function useProfile(): ProfileService;

/**
 * @file use-contacts.ts
 * @description Hook to access the ContactsBook from the authenticated UserDialer.
 * @layer React Hooks
 */

/**
 * Access the contacts book for managing user contacts.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * const contacts = useContacts();
 * await contacts.add({ walletAddress: '0x...' });
 * const all = await contacts.getAll();
 * ```
 */
declare function useContacts(): ContactsBook;

/**
 * @file use-party-lines.ts
 * @description Hook to access the PartyLinesService from the DialClient (no auth required).
 * @layer React Hooks
 */

/**
 * Access the party lines service for querying and creating party lines.
 *
 * This hook does NOT require authentication — it reads from the
 * public DialClient instance provided by DialProvider.
 *
 * @throws Error if used outside of a DialProvider.
 *
 * @example
 * ```tsx
 * const partyLines = usePartyLines();
 * const rooms = await partyLines.getActive();
 * ```
 */
declare function usePartyLines(): PartyLinesService;

/**
 * @file use-dial-event.ts
 * @description Hook to subscribe to UserDialer events with automatic cleanup.
 * @layer React Hooks
 */

/**
 * Subscribe to events on the authenticated UserDialer.
 *
 * The subscription is created when the component mounts (and the user is
 * authenticated) and cleaned up on unmount or when the event/callback changes.
 *
 * Tip: stabilise the callback with useCallback or pass a ref to avoid
 * unnecessary resubscriptions.
 *
 * @throws Error if used outside of a DialProvider.
 * @throws Error if the user is not authenticated.
 *
 * @example
 * ```tsx
 * useDialEvent('call:incoming', useCallback((call) => {
 *   console.log('Incoming call from:', call.from);
 * }, []));
 * ```
 */
declare function useDialEvent<T extends DialEventType>(event: T, callback: EventListener<T>): void;

export { DialClientContext, DialProvider, type DialProviderProps, type UseAuthReturn, UserDialerContext, useAuth, useCalls, useChat, useConference, useContacts, useDialClient, useDialEvent, usePartyLines, useProfile, useVoicemail };
