const { Component } = require('react')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const ReactMarkdown = require('react-markdown')
const linker = require('extension-link-enabler')
const generateLostAccountsNotice = require('../../lib/lost-accounts-notice')
const findDOMNode = require('react-dom').findDOMNode
const actions = require('../actions')
const { DEFAULT_ROUTE } = require('../routes')

class Notice extends Component {
  constructor (props) {
    super(props)

    this.state = {
      disclaimerDisabled: true,
    }
  }

  componentWillMount () {
    if (!this.props.notice) {
      this.props.history.push(DEFAULT_ROUTE)
    }
  }

  componentDidMount () {
    // eslint-disable-next-line react/no-find-dom-node
    var node = findDOMNode(this)
    linker.setupListener(node)
    if (document.getElementsByClassName('notice-box')[0].clientHeight < 310) {
      this.setState({ disclaimerDisabled: false })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.notice) {
      this.props.history.push(DEFAULT_ROUTE)
    }
  }

  componentWillUnmount () {
    // eslint-disable-next-line react/no-find-dom-node
    var node = findDOMNode(this)
    linker.teardownListener(node)
  }

  handleAccept () {
    this.setState({ disclaimerDisabled: true })
    this.props.onConfirm()
  }

  render () {
    const { notice = {} } = this.props
    const { title, date, body } = notice
    const { disclaimerDisabled } = this.state

    return (
      h('.flex-column.flex-center.flex-grow', {
        style: {
          width: '100%',
        },
      }, [
        h('h3.flex-center.text-transform-uppercase.terms-header', {
          style: {
            background: '#EBEBEB',
            color: '#AEAEAE',
            width: '100%',
            fontSize: '20px',
            textAlign: 'center',
            padding: 6,
          },
        }, [
          title,
        ]),

        h('h5.flex-center.text-transform-uppercase.terms-header', {
          style: {
            background: '#EBEBEB',
            color: '#AEAEAE',
            marginBottom: 24,
            width: '100%',
            fontSize: '20px',
            textAlign: 'center',
            padding: 6,
          },
        }, [
          date,
        ]),

        h('style', `

          .markdown {
            overflow-x: hidden;
          }

          .markdown h1, .markdown h2, .markdown h3 {
            margin: 10px 0;
            font-weight: bold;
          }

          .markdown strong {
            font-weight: bold;
          }
          .markdown em {
            font-style: italic;
          }

          .markdown p {
            margin: 10px 0;
          }

          .markdown a {
            color: #df6b0e;
          }

        `),

        h('div.markdown', {
          onScroll: (e) => {
            var object = e.currentTarget
            if (object.offsetHeight + object.scrollTop + 100 >= object.scrollHeight) {
              this.setState({ disclaimerDisabled: false })
            }
          },
          style: {
            background: 'rgb(235, 235, 235)',
            height: '310px',
            padding: '6px',
            width: '90%',
            overflowY: 'scroll',
            scroll: 'auto',
          },
        }, [
          h(ReactMarkdown, {
            className: 'notice-box',
            source: body,
            skipHtml: true,
          }),
        ]),

        h('button.primary', {
          disabled: disclaimerDisabled,
          onClick: () => this.handleAccept(),
          style: {
            marginTop: '18px',
          },
        }, 'Accept'),
      ])
    )
  }

}

const mapStateToProps = state => {
  const { metamask } = state
  const { noActiveNotices, nextUnreadNotice, lostAccounts } = metamask

  return {
    noActiveNotices,
    nextUnreadNotice,
    lostAccounts,
  }
}

Notice.propTypes = {
  notice: PropTypes.object,
  onConfirm: PropTypes.func,
  history: PropTypes.object,
}

const mapDispatchToProps = dispatch => {
  return {
    markNoticeRead: nextUnreadNotice => dispatch(actions.markNoticeRead(nextUnreadNotice)),
    markAccountsFound: () => dispatch(actions.markAccountsFound()),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { noActiveNotices, nextUnreadNotice, lostAccounts } = stateProps
  const { markNoticeRead, markAccountsFound } = dispatchProps

  let notice
  let onConfirm

  if (!noActiveNotices) {
    notice = nextUnreadNotice
    onConfirm = () => markNoticeRead(nextUnreadNotice)
  } else if (lostAccounts && lostAccounts.length > 0) {
    notice = generateLostAccountsNotice(lostAccounts)
    onConfirm = () => markAccountsFound()
  }

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    notice,
    onConfirm,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Notice)
