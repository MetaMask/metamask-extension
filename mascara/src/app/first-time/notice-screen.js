import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Markdown from 'react-markdown'
import { connect } from 'react-redux'
import debounce from 'lodash.debounce'
import { markNoticeRead } from '../../../../ui/app/actions'
import Identicon from '../../../../ui/app/components/identicon'
import Breadcrumbs from './breadcrumbs'
import { DEFAULT_ROUTE } from '../../../../ui/app/routes'
import LoadingScreen from './loading-screen'

class NoticeScreen extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    lastUnreadNotice: PropTypes.shape({
      title: PropTypes.string,
      date: PropTypes.string,
      body: PropTypes.string,
    }),
    location: PropTypes.shape({
      state: PropTypes.shape({
        next: PropTypes.func.isRequired,
      }),
    }),
    markNoticeRead: PropTypes.func,
    history: PropTypes.object,
    isLoading: PropTypes.bool,
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
    const { markNoticeRead, lastUnreadNotice, history } = this.props
    markNoticeRead(lastUnreadNotice)
      .then(() => history.push(DEFAULT_ROUTE))
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
        : (
          <div className="first-time-flow">
            <div className="first-view-main-wrapper">
              <div className="first-view-main">
                <div
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
              </div>
            </div>
          </div>
        )
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
