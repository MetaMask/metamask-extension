import React from 'react';
import { type ComponentType } from 'react';
import { type RouterProps } from 'react-router-dom';

/**
 * The underlying react-router-dom <Switch> component injects a
 * `computedMatch` property in each of the Route Children.
 * This computedMatch is unstable and causes additional re-renders.
 *
 * Since none of the routes use this prop, we have removed it.
 * @param WrappedComponent
 * @returns
 */
const withOptimisedRoute = (WrappedComponent: ComponentType<RouterProps>) => {
  return (props: RouterProps & { computedMatch: unknown }) => {
    const { computedMatch, ...rest } = props;
    return <WrappedComponent {...rest} />;
  };
};

export default withOptimisedRoute;
