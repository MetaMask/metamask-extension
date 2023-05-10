import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { showModal } from '../../store/actions';


export default function CustomizeFoxComponent() {
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const userCompletedSRPQuiz = useSelector((state) => state.metamask.userCompletedSRPQuiz);
  const dispatch = useDispatch();
  console.log({ accounts });

  const showSRPQuizModal = () => {
      dispatch(
        showModal({
          name: 'SRP_QUIZ',
          isSecurityCheckList: true,
        }),
      );
    }

  return (
    <div className="customized-fox">
      Wrapper
      <div>More</div>
      <div>{`Completed SRP QUIZ: ${userCompletedSRPQuiz}`}</div> 
      <button onClick={showSRPQuizModal}>srp quiz</button>
    </div>
  );
}
