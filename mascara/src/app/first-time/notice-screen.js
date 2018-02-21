import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Markdown from 'react-markdown'
import {connect} from 'react-redux'
import debounce from 'lodash.debounce'
import {markNoticeRead} from '../../../../ui/app/actions'
import Identicon from '../../../../ui/app/components/identicon'
import Breadcrumbs from './breadcrumbs'
import LoadingScreen from './loading-screen'

class NoticeScreen extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    lastUnreadNotice: PropTypes.shape({
      title: PropTypes.string,
      date: PropTypes.string,
      body: PropTypes.string,
    }),
    next: PropTypes.func.isRequired,
    markNoticeRead: PropTypes.func,
  };

  static defaultProps = {
    lastUnreadNotice: {},
  };

  state = {
    atBottom: false,
  }

  componentDidMount () {
    this.onScroll()
  }

  acceptTerms = () => {
    const { markNoticeRead, lastUnreadNotice, next } = this.props
    const defer = markNoticeRead(lastUnreadNotice)
      .then(() => this.setState({ atBottom: false }))

    if ((/terms/gi).test(lastUnreadNotice.title)) {
      defer.then(next)
    }
  }

  onScroll = debounce(() => {
    if (this.state.atBottom) return

    const target = document.querySelector('.tou__body')
    const {scrollTop, offsetHeight, scrollHeight} = target
    const atBottom = scrollTop + offsetHeight >= scrollHeight

    this.setState({atBottom: atBottom})
  }, 25)

  render () {
    const {
      address,
      lastUnreadNotice: { title, body },
      isLoading,
    } = this.props
    const { atBottom } = this.state

    return (
      isLoading
        ? <LoadingScreen />
        : <div
          className="tou"
          onScroll={this.onScroll}
        >
          <Identicon address={address} diameter={70} />
          <div className="tou__title">{title}</div>
          <Markdown
            className="tou__body markdown"
            source={body}
            skipHtml
          />
          <button
            className="first-time-flow__button"
            onClick={atBottom && this.acceptTerms}
            disabled={!atBottom}
          >
            Accept
          </button>
          <Breadcrumbs total={3} currentIndex={2} />
        </div>
    )
  }
}

export default connect(
  ({ metamask: { selectedAddress, lastUnreadNotice }, appState: { isLoading } }) => ({
    lastUnreadNotice,
    address: selectedAddress,
  }),
  dispatch => ({
    markNoticeRead: notice => dispatch(markNoticeRead(notice)),
  })
)(NoticeScreen)
