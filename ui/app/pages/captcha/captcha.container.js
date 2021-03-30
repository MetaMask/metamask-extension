import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import { sendCaptchaToken } from '../../store/actions';

import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getCurrentLocale } from '../../ducks/metamask/metamask';

import Captcha from './captcha.component';

function mapStateToProps(state) {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    currentLocale: getCurrentLocale(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendCaptchaToken: (token) => dispatch(sendCaptchaToken(token)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Captcha);
