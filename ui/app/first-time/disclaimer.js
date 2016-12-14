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
  const state = this.state || {disclaimerDisabled: true}
  const disabled = state.disclaimerDisabled

  return (
    h('.flex-column.flex-center.flex-grow', [

      h('h3.flex-center.text-transform-uppercase.terms-header', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: 0,
          marginBottom: 0,
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
          overflow-x: hidden;
          font-weight: lighter;
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
        onScroll: (e) => {
          var object = e.currentTarget
          if (object.offsetHeight + object.scrollTop + 100 >= object.scrollHeight) {
            this.setState({disclaimerDisabled: false})
          }
        },
        style: {
          background: 'transparent',
          height: '415px',
          padding: '0 5px',
          width: '100%',
          overflowY: 'scroll',
        },
      }, [

        h(ReactMarkdown, {
          source: disclaimer,
          skipHtml: true,
        }),

      ]),

      h('button', {
        style: {
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
        },
        disabled,
        onClick: () => this.props.dispatch(actions.agreeToDisclaimer()),
      }, disabled ? 'Scroll Down to Enable' : 'I Agree'),
    ])
  )
}
