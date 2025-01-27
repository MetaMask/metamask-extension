import { useCallback } from 'react';
import { SAMPLE_ROUTE } from '../../helpers/constants/routes';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectSampleCounter } from '../../selectors/sample';
import { updateSampleCounter } from '../../ducks/sample/sample';

export function useSample() {
  const history = useHistory();
  const dispatch = useDispatch();
  const globalCounter = useSelector(selectSampleCounter);

  const updateGlobalCounter = useCallback(
    (amount: number) => {
      dispatch(updateSampleCounter(amount));
    },
    [dispatch],
  );

  const openSampleFeature = useCallback(() => {
    history.push(SAMPLE_ROUTE);
  }, [history]);

  return { globalCounter, openSampleFeature, updateGlobalCounter };
}
