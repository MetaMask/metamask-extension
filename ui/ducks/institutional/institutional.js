import { createSlice } from '@reduxjs/toolkit';

const name = 'institutionalFeatures';

const initialState = {};

const slice = createSlice({
  name,
  initialState,
});

const { reducer } = slice;

export default reducer;

export const getInstitutionalConnectRequests = (state) =>
  state.metamask[name]?.connectRequests;

export const getChannelId = (state) => state.metamask[name]?.channelId;

export const getConnectionRequest = (state) =>
  state.metamask[name]?.connectionRequest;
