import { connect } from 'react-redux';
import ConfirmDeployContract from './confirm-deploy-contract.component';

const mapStateToProps = (state) => {
  const { confirmTransaction: { txData } = {} } = state;

  return {
    txData,
  };
};

export default connect(mapStateToProps)(ConfirmDeployContract);
