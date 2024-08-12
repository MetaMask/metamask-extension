import { createSlice } from '@reduxjs/toolkit';

type InstitutionalFeaturesState = {
  connectRequests?: ConnectRequest[];
  channelId?: string;
  connectionRequest?: {
    payload: string;
    traceId: string;
    channelId: string;
  };
};
type Label = {
  key: string;
  value: string;
};
type ConnectRequest = {
  channelId: string;
  traceId: string;
  token: string;
  environment: string;
  feature: string;
  service: string;
  origin: string;
  custodian: string;
  chainId: string;
  labels: Label[];
};

type MetaMaskState = {
  metamask: {
    [key: string]: InstitutionalFeaturesState;
  };
};

const name = 'institutionalFeatures';

const initialState: MetaMaskState = {
  metamask: {
    [name]: {
      connectRequests: undefined,
      channelId: undefined,
      connectionRequest: undefined,
    },
  },
};

const slice = createSlice({
  name,
  initialState,
  reducers: {},
});

const { reducer } = slice;

export default reducer;

export const getInstitutionalConnectRequests = (
  state: MetaMaskState,
): ConnectRequest[] | undefined => state.metamask[name]?.connectRequests;

export const getChannelId = (state: MetaMaskState): string | undefined =>
  state.metamask[name]?.channelId;

export const getConnectionRequest = (
  state: MetaMaskState,
): { payload: string; traceId: string; channelId: string } | undefined =>
  state.metamask[name]?.connectionRequest;
