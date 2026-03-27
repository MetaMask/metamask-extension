import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DialProfile, Contact, Call } from '@dial-wtf/sdk';

// ── Types ────────────────────────────────────────────────────────

export interface DialState {
  /** Whether the user is authenticated with Dial */
  isAuthenticated: boolean;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** The authenticated wallet address */
  walletAddress: string | null;
  /** Dial contacts (keyed by lowercase wallet address) */
  contacts: Record<string, Contact>;
  /** Whether contacts are loading */
  contactsLoading: boolean;
  /** Dial profiles cache (keyed by lowercase wallet address) */
  profiles: Record<string, DialProfile>;
  /** Active call state */
  activeCall: Call | null;
  /** Error message */
  error: string | null;
}

const initialState: DialState = {
  isAuthenticated: false,
  isAuthenticating: false,
  walletAddress: null,
  contacts: {},
  contactsLoading: false,
  profiles: {},
  activeCall: null,
  error: null,
};

// ── Slice ────────────────────────────────────────────────────────

const dialSlice = createSlice({
  name: 'dial',
  initialState,
  reducers: {
    setAuthenticated(
      state,
      action: PayloadAction<{ walletAddress: string }>,
    ) {
      state.isAuthenticated = true;
      state.isAuthenticating = false;
      state.walletAddress = action.payload.walletAddress;
      state.error = null;
    },

    setAuthenticating(state) {
      state.isAuthenticating = true;
      state.error = null;
    },

    setUnauthenticated(state) {
      state.isAuthenticated = false;
      state.isAuthenticating = false;
      state.walletAddress = null;
      state.error = null;
    },

    setAuthError(state, action: PayloadAction<string>) {
      state.isAuthenticating = false;
      state.error = action.payload;
    },

    setContacts(state, action: PayloadAction<Contact[]>) {
      state.contacts = {};
      for (const contact of action.payload) {
        state.contacts[contact.walletAddress.toLowerCase()] = contact;
      }
      state.contactsLoading = false;
    },

    setContactsLoading(state, action: PayloadAction<boolean>) {
      state.contactsLoading = action.payload;
    },

    addContact(state, action: PayloadAction<Contact>) {
      state.contacts[action.payload.walletAddress.toLowerCase()] =
        action.payload;
    },

    updateContact(state, action: PayloadAction<Contact>) {
      state.contacts[action.payload.walletAddress.toLowerCase()] =
        action.payload;
    },

    removeContact(state, action: PayloadAction<string>) {
      delete state.contacts[action.payload.toLowerCase()];
    },

    setProfile(state, action: PayloadAction<DialProfile>) {
      state.profiles[action.payload.walletAddress.toLowerCase()] =
        action.payload;
    },

    setActiveCall(state, action: PayloadAction<Call | null>) {
      state.activeCall = action.payload;
    },

    clearError(state) {
      state.error = null;
    },

    resetDialState() {
      return initialState;
    },
  },
});

export const {
  setAuthenticated,
  setAuthenticating,
  setUnauthenticated,
  setAuthError,
  setContacts,
  setContactsLoading,
  addContact,
  updateContact,
  removeContact,
  setProfile,
  setActiveCall,
  clearError,
  resetDialState,
} = dialSlice.actions;

export default dialSlice.reducer;
