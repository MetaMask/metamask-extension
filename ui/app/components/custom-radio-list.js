const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = RadioList

inherits(RadioList, Component)
function RadioList () {
  Component.call(this)
}

RadioList.prototype.render = function () {
  const props = this.props
  const activeClass = '.custom-radio-selected'
  const inactiveClass = '.custom-radio-inactive'
  const {
    lables,
    defaultFocus,
  } = props


  return (
    h('.flex-row', {
      style: {
        fontSize: '12px',
      },
    }, [
      h('.flex-column.custom-radios', {
        style: {
          marginRight: '5px',
        },
      },
        lables.map((lable, i) => {
          let isSelcted = (this.state !== null)
          isSelcted = isSelcted ? (this.state.selected === lable) : (defaultFocus === lable)
          return h(isSelcted ? activeClass : inactiveClass, {
            title: lable,
            onClick: (event) => {
              this.setState({selected: event.target.title})
              props.onClick(event)
            },
          })
        })
      ),
      h('.text', {},
        lables.map((lable) => {
          if (props.subtext) {
            return h('.flex-row', {}, [
              h('.radio-titles', lable),
              h('.radio-titles-subtext', `- ${props.subtext[lable]}`),
            ])
          } else {
            return h('.radio-titles', lable)
          }
        })
      ),
    ])
  )
}

