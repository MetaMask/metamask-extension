export enum DelineatorType {
  content = 'content',
  error = 'error',
  insights = 'insights',
}

export const getDelineatorTitle = (type: DelineatorType) => {
  switch (type) {
    case DelineatorType.error:
      return 'errorWithSnap';
    case DelineatorType.insights:
      return 'insightsFromSnap';
    default:
      return 'contentFromSnap';
  }
};
