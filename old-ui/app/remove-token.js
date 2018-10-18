const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')

module.exports = connect(mapStateToProps)(RemoveTokenScreen)

function mapStateToProps (state) {
  return {}
}

inherits(RemoveTokenScreen, Component)
function RemoveTokenScreen () {
  this.state = {}
  Component.call(this)
}

RemoveTokenScreen.prototype.render = function () {
  const props = this.props

  const warning = `Are you sure you want to remove token "${props.symbol}"?`

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            props.dispatch(actions.goHome())
          },
          style: {
            position: 'absolute',
            left: '30px',
          },
        }),
        h('h2.page-subtitle', 'Remove Token'),
      ]),

      h('div', {
        style: {
          display: 'inline-block',
          textAlign: 'center',
          padding: '0 30px',
        },
      }, [
        h('p.confirm-label', warning),
      ]),

      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around.flex-right', {
          style: {
            padding: '20px 30px',
          },
        }, [
          h('button.btn-violet',
          {
            onClick: () => {
              this.props.dispatch(actions.goHome())
            },
          },
          'No'),
          h('button', {
            style: {
              alignSelf: 'center',
            },
            onClick: (event) => {
              this.props.dispatch(actions.removeToken(props.address))
                .then(() => {
                  this.props.dispatch(actions.goHome())
                })
            },
          }, 'Yes'),
        ]),
      ]),
    ])
  )
}
