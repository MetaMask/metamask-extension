import React, {Component, PropTypes} from 'react'
import Markdown from 'react-markdown'
import {connect} from 'react-redux';
import {markNoticeRead} from '../../../../ui/app/actions'
import Identicon from '../../../../ui/app/components/identicon'
import Breadcrumbs from './breadcrumbs'

class NoticeScreen extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    lastUnreadNotice: PropTypes.shape({
      title: PropTypes.string,
      date: PropTypes.string,
      body: PropTypes.string
    }),
    next: PropTypes.func.isRequired
  };

  static defaultProps = {
    lastUnreadNotice: {}
  };

  acceptTerms = () => {
    const { markNoticeRead, lastUnreadNotice, next } = this.props;
    const defer = markNoticeRead(lastUnreadNotice)

    if ((/terms/gi).test(lastUnreadNotice.title)) {
      defer.then(next)
    }
  }

  render() {
    const {
      address,
      lastUnreadNotice: { title, body }
    } = this.props;

    return (
      <div className="tou">
        <Identicon address={address} diameter={70} />
        <div className="tou__title">{title}</div>
        <Markdown
          className="tou__body"
          source={body}
          skipHtml
        />
        <button
          className="first-time-flow__button"
          onClick={this.acceptTerms}
        >
          Accept
        </button>
        <Breadcrumbs total={3} currentIndex={2} />
      </div>
    )
  }
}

export default connect(
  ({ metamask: { identities, lastUnreadNotice } }) => ({
    lastUnreadNotice,
    address: Object.entries(identities)
      .map(([key]) => key)[0]
  }),
  dispatch => ({
    markNoticeRead: notice => dispatch(markNoticeRead(notice))
  })
)(NoticeScreen)
