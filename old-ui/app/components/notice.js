const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const ReactMarkdown = require('react-markdown')
const linker = require('extension-link-enabler')
const findDOMNode = require('react-dom').findDOMNode

module.exports = Notice

inherits(Notice, Component)
function Notice () {
  Component.call(this)
}

Notice.prototype.render = function () {
  const { notice, onConfirm } = this.props
  const { title, body } = notice
  const state = this.state || { disclaimerDisabled: false }
  const disabled = state.disclaimerDisabled

  return (
    h('.flex-column.flex-center.flex-grow', {
      style: {
        width: '100%',
        fontFamily: 'Nunito SemiBold',
      },
    }, [
      h('style', `

        .markdown {
          overflow-x: hidden;
        }

        .markdown h1, .markdown h2, .markdown h3 {
          margin: 20px 0;
          line-height: 18px;
          font-weight: normal;
        }

        .markdown strong {
          font-weight: normal;
        }
        .markdown em {
          font-style: italic;
        }

        .markdown p {
          margin: 20px 0;
          line-height: 18px;
          font-weight: normal;
        }

        .markdown a {
          color: #60db97;
        }

        .markdown::-webkit-scrollbar {
            width: 16px;
        }
         
        .markdown::-webkit-scrollbar-track {
            background-color: transparent;
        }
         
        .markdown::-webkit-scrollbar-thumb {
          background-color: #411a6a;
          border-radius: 2px;
          border: 6px solid transparent;
          background-clip: content-box;
        }

      `), [
        h('h3.flex-center.terms-header', {
          key: 'notice-key',
          style: {
            color: '#ffffff',
            width: '100%',
            fontSize: '16px',
            textAlign: 'center',
            margin: '20px 0px',
          },
        }, [
          title,
        ]),
        h('div.markdown', {
          key: 'notice-div-key',
          onScroll: (e) => {
            var object = e.currentTarget
            if (object.offsetHeight + object.scrollTop + 100 >= object.scrollHeight) {
              this.setState({disclaimerDisabled: false})
            }
          },
          style: {
            background: '#542289',
            color: '#ffffff',
            height: '430px',
            width: '90%',
            overflowY: 'scroll',
            scroll: 'auto',
            borderRadius: '3px',
            fontSize: '14px',
          },
        }, [
          h(ReactMarkdown, {
            className: 'notice-box',
            source: body,
            skipHtml: true,
          }),
        ]),

        h('button', {
          key: 'notice-button-key',
          disabled,
          onClick: () => {
            this.setState({disclaimerDisabled: true})
            onConfirm()
          },
          style: {
            marginTop: '18px',
          },
        }, 'Accept'),
      ],
    ])
  )
}

Notice.prototype.setInitialDisclaimerState = function () {
  if (document.getElementsByClassName('notice-box')[0].clientHeight < 310) {
    this.setState({disclaimerDisabled: false})
  }
}

Notice.prototype.componentDidMount = function () {
  // eslint-disable-next-line react/no-find-dom-node
  var node = findDOMNode(this)
  linker.setupListener(node)
  if (document.getElementsByClassName('notice-box')[0].clientHeight < 300) {
    this.setState({disclaimerDisabled: false})
  }
  this.setInitialDisclaimerState()
}

Notice.prototype.componentDidUpdate = function (prevProps) {
  const { notice: { id } = {} } = this.props
  const { notice: { id: prevNoticeId } = {} } = prevProps

  if (id !== prevNoticeId) {
    this.setInitialDisclaimerState()
  }
}

Notice.prototype.componentWillUnmount = function () {
  // eslint-disable-next-line react/no-find-dom-node
  var node = findDOMNode(this)
  linker.teardownListener(node)
}
