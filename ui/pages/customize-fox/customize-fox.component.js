import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { showModal } from '../../store/actions';
import { useHistory } from 'react-router-dom';
import { CUSTOMIZE_FOX_ROUTE } from '../../helpers/constants/routes';

export default function CustomizeFoxComponent() {
  const history = useHistory();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const userCompletedSRPQuiz = useSelector(
    (state) => state.metamask.userCompletedSRPQuiz,
  );
  const dispatch = useDispatch();

  const showSRPQuizModal = () => {
    dispatch(
      showModal({
        name: 'SRP_QUIZ',
        isSecurityCheckList: true,
      }),
    );
  };

  return (
    <div className="customized-fox">
      <div>{`Completed SRP QUIZ: ${userCompletedSRPQuiz}`}</div>
      <button onClick={showSRPQuizModal}>srp quiz</button>
      <button onClick={() => history.push(CUSTOMIZE_FOX_ROUTE)}>
        Customize fox
      </button>
    </div>
  );
}
