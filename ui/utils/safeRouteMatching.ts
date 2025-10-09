import { matchPath, PathMatch, PathPattern } from 'react-router-dom-v5-compat';

export const safeMatchPath = (
  pattern: PathPattern,
  pathname: string,
): PathMatch | null => {
  try {
    return matchPath(pattern, pathname);
  } catch (error) {
    console.warn('safeMatchPath: Error during route matching', error);
    return null;
  }
};
