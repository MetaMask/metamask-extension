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
    labels,
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
        labels.map((label, i) => {
          let isSelcted = (this.state !== null)
          isSelcted = isSelcted ? (this.state.selected === label) : (defaultFocus === label)
          return h(isSelcted ? activeClass : inactiveClass, {
            title: label,
            onClick: (event) => {
              this.setState({selected: event.target.title})
              props.onClick(event)
            },
          })
        })
      ),
      h('.text', {},
        labels.map((label) => {
          if (props.subtext) {
            return h('.flex-row', {}, [
              h('.radio-titles.font-pre-medium', label),
              h('.radio-titles-subtext.font-pre-medium', ` - ${props.subtext[label]}`),
            ])
          } else {
            return h('.radio-titles.font-pre-medium', label)
          }
        })
      ),
    ])
  )
}

