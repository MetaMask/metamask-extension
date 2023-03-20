export const complianceActivated = (state) =>
  Boolean(state.metamask.institutionalFeatures?.complianceProjectId);
export const getInstitutionalConnectRequests = (state) =>
  state.metamask.institutionalFeatures?.connectRequests;
