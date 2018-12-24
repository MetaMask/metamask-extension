import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Markdown from 'react-markdown'
import debounce from 'lodash.debounce'
import Button from '../../../button'
import Identicon from '../../../identicon'
import Breadcrumbs from '../../../breadcrumbs'
import { DEFAULT_ROUTE, INITIALIZE_SEED_PHRASE_ROUTE } from '../../../../routes'

export default class Notices extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    address: PropTypes.string.isRequired,
    completeOnboarding: PropTypes.func,
    history: PropTypes.object,
    isImportedKeyring: PropTypes.bool,
    markNoticeRead: PropTypes.func,
    nextUnreadNotice: PropTypes.shape({
      title: PropTypes.string,
      date: PropTypes.string,
      body: PropTypes.string,
    }),
    noActiveNotices: PropTypes.bool,
    openBuyEtherModal: PropTypes.func,
  };

  static defaultProps = {
    nextUnreadNotice: {},
  };

  state = {
    atBottom: false,
  }

  componentDidMount () {
    const { noActiveNotices, history } = this.props

    if (noActiveNotices) {
      history.push(INITIALIZE_SEED_PHRASE_ROUTE)
    }

    this.onScroll()
  }

  acceptTerms = async () => {
    const {
      completeOnboarding,
      history,
      isImportedKeyring,
      markNoticeRead,
      nextUnreadNotice,
      openBuyEtherModal,
    } = this.props

    const hasActiveNotices = await markNoticeRead(nextUnreadNotice)

    if (!hasActiveNotices) {
      if (isImportedKeyring) {
        await completeOnboarding()
        history.push(DEFAULT_ROUTE)
        openBuyEtherModal()
      } else {
        history.push(INITIALIZE_SEED_PHRASE_ROUTE)
      }
    } else {
      this.setState({ atBottom: false }, () => this.onScroll())
    }
  }

  onScroll = debounce(() => {
    if (this.state.atBottom) {
      return
    }

    const target = document.querySelector('.first-time-flow__markdown')

    if (target) {
      const { scrollTop, offsetHeight, scrollHeight } = target
      const atBottom = scrollTop + offsetHeight >= scrollHeight

      this.setState({ atBottom })
    }
  }, 25)

  render () {
    const { t } = this.context
    const { isImportedKeyring, address, nextUnreadNotice: { title, body } } = this.props
    const { atBottom } = this.state

    return (
      <div
        className="first-time-flow__wrapper"
        onScroll={this.onScroll}
      >
        <Identicon
          className="first-time-flow__unique-image"
          address={address}
          diameter={70}
        />
        <div className="first-time-flow__header">
          { title }
        </div>
        <Markdown
          className="first-time-flow__markdown"
          source={body}
          skipHtml
        />
        <Button
          type="first-time"
          className="first-time-flow__button"
          onClick={atBottom && this.acceptTerms}
          disabled={!atBottom}
        >
          { t('accept') }
        </Button>
        <Breadcrumbs
          className="first-time-flow__breadcrumbs"
          total={isImportedKeyring ? 2 : 3}
          currentIndex={1}
        />
      </div>
    )
  }
}
