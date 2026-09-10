// return true if user has set their marketing consent preference or if they are a social login user
export const getDataCollectionForMarketing = (state) =>
  state.metamask.dataCollectionForMarketing;

// return whether the user has opted in to analytics (AnalyticsController.optedIn)
export const getOptedIn = (state) => state.metamask.optedIn === true;

// return true once the user has completed the metrics participation prompt (yes or no)
// Backed by AnalyticsController.consentDecisionMade.
export const getConsentDecisionMade = (state) =>
  state.metamask.consentDecisionMade === true;

export const getPna25Acknowledged = (state) => state.metamask.pna25Acknowledged;
