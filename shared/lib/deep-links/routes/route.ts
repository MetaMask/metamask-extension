// TODO: Remove restricted import
/* eslint-disable import/no-restricted-paths */
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../../ui/helpers/constants/routes';

export {
  DEFAULT_ROUTE,
  DEEP_LINK_ROUTE,
  NOTIFICATIONS_ROUTE,
} from '../../../../ui/helpers/constants/routes';

/**
 * Represents the final destination.
 */
export type Destination =
  | {
      path: string;
      query: URLSearchParams;
    }
  | {
      redirectTo: URL;
    };

export type RouteOptions = {
  /**
   * The pathname of the route.
   * This is the deep link URL path that identifies the route, e.g. '/swap'.
   */
  pathname: string;
  /**
   * A function that takes URL parameters and returns a title for the route.
   */
  getTitle: (params: URLSearchParams) => string;
  /**
   * A handler function that processes URL parameters and returns a destination.
   * The destination includes a path and query parameters.
   *
   * @throws if the handler fails to process the params
   */
  handler: (params: URLSearchParams) => Destination;
};

export const SWAP_ROUTE = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;

/**
 * Represents a route in the application.
 * A route is defined by a pathname, a function to get the title based on URL parameters,
 * and a handler function that processes URL parameters to return a destination.
 */
export class Route {
  /**
   * @see {@link RouteOptions.pathname}
   */
  public readonly pathname: RouteOptions['pathname'];

  /**
   * @see {@link RouteOptions.getTitle}
   */
  public readonly getTitle: RouteOptions['getTitle'];

  /**
   * @see {@link RouteOptions.handler}
   */
  public readonly handler: RouteOptions['handler'];

  constructor(options: RouteOptions) {
    this.pathname = options.pathname.toLowerCase();
    this.getTitle = options.getTitle;
    this.handler = options.handler;
  }
}
