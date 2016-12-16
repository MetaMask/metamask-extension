const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const ReactMarkdown = require('react-markdown')
const connect = require('react-redux').connect
const actions = require('./actions')
const linker = require('extension-link-enabler')
const findDOMNode = require('react-dom').findDOMNode

module.exports = connect(mapStateToProps)(Notice)

function mapStateToProps (state) {
  return {
    lastUnreadNotice: state.metamask.lastUnreadNotice,
  }
}

inherits(Notice, Component)
function Notice () {
  Component.call(this)
}

Notice.prototype.render = function () {
  const props = this.props
  const title = props.lastUnreadNotice.title
  const date = props.lastUnreadNotice.date

  return (
    h('.flex-column.flex-center.flex-grow', [
      h('h3.flex-center.text-transform-uppercacse.terms-header', {
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

      h('h5.flex-center.text-transform-uppercacse.terms-header', {
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
          color: blue;
        }

      `),

      h('div.markdown', {
        style: {
          background: 'rgb(235, 235, 235)',
          height: '310px',
          padding: '6px',
          width: '90%',
          overflowY: 'scroll',
          scroll: 'auto',
        },
      }, [
        `${props.lastUnreadNotice.title}`,
        h(ReactMarkdown, {
          source: props.lastUnreadNotice.body,
          skipHtml: true,
        }),
      ]),

      h('button', {
        onClick: () => props.dispatch(actions.markNoticeRead(props.lastUnreadNotice)),
        style: {
          marginTop: '18px',
        },
      }, 'Continue'),
    ])
  )
}

Notice.prototype.componentDidMount = function () {
  var node = findDOMNode(this)
  linker.setupListener(node)
}

Notice.prototype.componentWillUnmount = function () {
  var node = findDOMNode(this)
  linker.teardownListener(node)
}
