import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

export default function withRouterV5Compat<P>(
  WrappedComponent: React.ComponentType<P>,
) {
  return (props: P) => {
    const navigate = useNavigate();

    return <WrappedComponent {...props} {...{ navigate }} />;
  };
}
