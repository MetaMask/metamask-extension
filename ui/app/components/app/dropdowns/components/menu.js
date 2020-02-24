const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')

<<<<<<< HEAD
inherits(Menu, Component)
function Menu () { Component.call(this) }
=======
/**
 * Menu component
 * @returns {Component|null}
 */
export function Menu (props) {
  const { className, children, isShowing } = props
  return isShowing
    ? <div className={classnames('menu', className)}>{children}</div>
    : null
}
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

Menu.prototype.render = function () {
  const { className = '', children, isShowing } = this.props
  return isShowing
    ? h('div', { className: `menu ${className}` }, children)
    : h('noscript')
}

inherits(Item, Component)
function Item () { Component.call(this) }

<<<<<<< HEAD
Item.prototype.render = function () {
=======
export function Item (props) {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  const {
    icon,
    children,
    text,
    subText,
    className = '',
    onClick,
  } = this.props
  const itemClassName = `menu__item ${className} ${onClick ? 'menu__item--clickable' : ''}`
  const iconComponent = icon ? h('div.menu__item__icon', [icon]) : null
  const textComponent = text ? h('div.menu__item__text', text) : null
  const subTextComponent = subText ? h('div.menu__item__subtext', subText) : null

  return children
    ? h('div', { className: itemClassName, onClick }, children)
    : h('div.menu__item', { className: itemClassName, onClick }, [ iconComponent, textComponent, subTextComponent ]
      .filter(d => Boolean(d))
    )
}

inherits(Divider, Component)
function Divider () { Component.call(this) }

<<<<<<< HEAD
Divider.prototype.render = function () {
  return h('div.menu__divider')
}

inherits(CloseArea, Component)
function CloseArea () { Component.call(this) }
=======
export function Divider () {
  return <div className="menu__divider" />
}

export function CloseArea ({ onClick }) {
  return <div className="menu__close-area" onClick={onClick} />
}
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

CloseArea.prototype.render = function () {
  return h('div.menu__close-area', { onClick: this.props.onClick })
}
