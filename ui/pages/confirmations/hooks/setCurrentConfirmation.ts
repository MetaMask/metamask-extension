import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { updateCurrentConfirmation } from '../../../ducks/confirm/confirm';
import useCurrentConfirmation from './useCurrentConfirmation';

/*
 * This hook is called from <Confirm /> component to set current transaction.
 * This hook should be invoked only when we are setting or resetting the
 * current confirmation displayed to the user.
 */
const setCurrentConfirmation = () => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useCurrentConfirmation();

  useEffect(() => {
    if (currentConfirmation) {
      dispatch(updateCurrentConfirmation(currentConfirmation));
    }
  }, [currentConfirmation]);

  useEffect(() => {
    return () => {
      dispatch(updateCurrentConfirmation(undefined));
    };
  }, []);
};

export default setCurrentConfirmation;
