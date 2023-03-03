import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { SEND_ROUTE } from '../../helpers/constants/routes';
import { editExistingTransaction } from '../../ducks/send';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getTxData } from '../../selectors';
import { AssetType } from '../../../shared/constants/transaction';

export default function ConfirmSendEther() {
  const history = useHistory();
  const dispatch = useDispatch();

  const txData = useSelector(getTxData);

  const handleEditTransaction = async ({ confirmTransactionData }) => {
    const { id } = confirmTransactionData;
    await dispatch(editExistingTransaction(AssetType.token, id.toString()));
    dispatch(clearConfirmTransaction());
  };

  const handleEdit = (confirmTransactionData) => {
    handleEditTransaction(confirmTransactionData).then(() => {
      history.push(SEND_ROUTE);
    });
  };

  const shouldHideData = () => {
    const { txParams = {} } = txData;
    return !txParams.data;
  };

  return (
    <ConfirmTransactionBase
      actionKey="confirm"
      hideData={shouldHideData}
      onEdit={(confirmTransactionData) => handleEdit(confirmTransactionData)}
    />
  );
}

// export default class ConfirmSendEther extends Component {
//   static contextTypes = {
//     t: PropTypes.func,
//   };

//   static propTypes = {
//     editTransaction: PropTypes.func,
//     history: PropTypes.object,
//     txParams: PropTypes.object,
//   };

//   handleEdit({ txData }) {
//     const { editTransaction, history } = this.props;
//     editTransaction(txData).then(() => {
//       history.push(SEND_ROUTE);
//     });
//   }

//   shouldHideData() {
//     const { txParams = {} } = this.props;
//     return !txParams.data;
//   }

//   render() {
//     const hideData = this.shouldHideData();

//     return (
//       <ConfirmTransactionBase
//         actionKey="confirm"
//         hideData={hideData}
//         onEdit={(confirmTransactionData) =>
//           this.handleEdit(confirmTransactionData)
//         }
//       />
//     );
//   }
// }
