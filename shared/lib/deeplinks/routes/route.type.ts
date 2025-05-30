export type Destination = {
  path: string;
  query: URLSearchParams;
};
export type Route = {
  pathname: string;
  getTitle: (params: URLSearchParams) => string;
  handler: (params: URLSearchParams) => Destination;
};
