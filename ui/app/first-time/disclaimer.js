const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../actions')
const ReactMarkdown = require('react-markdown')
const fs = require('fs')
const path = require('path')
const disclaimer = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'USER_AGREEMENT.md')).toString()
module.exports = connect(mapStateToProps)(DisclaimerScreen)

function mapStateToProps (state) {
  return {}
}

inherits(DisclaimerScreen, Component)
function DisclaimerScreen () {
  Component.call(this)
}

DisclaimerScreen.prototype.render = function () {
  return (
    h('.flex-column.flex-center.flex-grow', [

      h('h3.flex-center.text-transform-uppercase.terms-header', {
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
        'MetaMask Terms & Conditions',
      ]),

      h('style', `

        .markdown {
          font-family: Times New Roman;
        }
        .markdown h1, .markdown h2, .markdown h3 {
          margin: 10px 0;
          font-family: arial sans-serif;
          font-weight: bold;
        }

      `),

      h('div.markdown', {
        onScroll: (e) => {
          var object = e.currentTarget
          if (object.offsetHeight + object.scrollTop + 100 >= object.scrollHeight) {
            var button = document.getElementById('agree')
            button.disabled = false
            button.addEventListener('click', () => this.props.dispatch(actions.agreeToDisclaimer()))
          }
        },
        style: {
          // whiteSpace: 'pre-line',
          background: 'rgb(235, 235, 235)',
          height: '310px',
          padding: '6px',
          width: '80%',
          overflowY: 'scroll',
        },
      }, [

        h(ReactMarkdown, {
          source: disclaimer,
          skipHtml: true,
        }),

      ]),

      h('button#agree', {
        style: { marginTop: '18px' },
        disabled: true,
        onClick: () => this.props.dispatch(actions.agreeToDisclaimer()),
      }, 'I Agree'),
    ])
  )
}
