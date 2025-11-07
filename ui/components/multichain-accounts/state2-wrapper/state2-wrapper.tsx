import React from 'react';
import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';

type State2WrapperProps = {
  state1Component: React.ComponentType<unknown>;
  state2Component: React.ComponentType<unknown>;
  [key: string]: unknown;
};

export const State2Wrapper = React.memo<State2WrapperProps>((props) => {
  const isState2Enabled = useSelector(getIsMultichainAccountsState2Enabled);
  const {
    state1Component: State1Component,
    state2Component: State2Component,
    ...restOfProps
  } = props;

  return isState2Enabled ? (
    <State2Component {...restOfProps} />
  ) : (
    <State1Component {...restOfProps} />
  );
});
