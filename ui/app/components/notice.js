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
  const { title, date, body } = notice
  const state = this.state || { disclaimerDisabled: true }
  const disabled = state.disclaimerDisabled

  return (
    h('.flex-column.flex-center.flex-grow', [
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
            this.setState({disclaimerDisabled: false})
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

      h('button', {
        disabled,
        onClick: () => {
          this.setState({disclaimerDisabled: true})
          onConfirm()
        },
        style: {
          marginTop: '18px',
        },
      }, 'Accept'),
    ])
  )
}

Notice.prototype.componentDidMount = function () {
  var node = findDOMNode(this)
  linker.setupListener(node)
  if (document.getElementsByClassName('notice-box')[0].clientHeight < 310) {
    this.setState({disclaimerDisabled: false})
  }
}

Notice.prototype.componentWillUnmount = function () {
  var node = findDOMNode(this)
  linker.teardownListener(node)
}
