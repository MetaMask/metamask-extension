export enum DelineatorType {
  Content = 'content',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Error = 'error',
  Insights = 'insights',
  Description = 'description',
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  Warning = 'warning',
  ///: END:ONLY_INCLUDE_IN
}

export const getDelineatorTitle = (type: DelineatorType) => {
  switch (type) {
    case DelineatorType.Error:
      return 'errorWithSnap';
    case DelineatorType.Insights:
      return 'insightsFromSnap';
    case DelineatorType.Description:
      return 'descriptionFromSnap';
    ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
    case DelineatorType.Warning:
      return 'warningFromSnap';
    ///: END:ONLY_INCLUDE_IN
    default:
      return 'contentFromSnap';
  }
};
