import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import ViewSnap from './view-snap.component';

const mapStateToProps = (_, ownProps) => {
  const { snap } = ownProps;

  return {
    snap,
  };
};

export default compose(withRouter, connect(mapStateToProps))(ViewSnap);
