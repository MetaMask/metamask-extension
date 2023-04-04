export enum DelineatorType {
  Content = 'content',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Error = 'error',
  Insights = 'insights',
}

export const getDelineatorTitle = (type: DelineatorType) => {
  switch (type) {
    case DelineatorType.Error:
      return 'errorWithSnap';
    case DelineatorType.Insights:
      return 'insightsFromSnap';
    default:
      return 'contentFromSnap';
  }
};
