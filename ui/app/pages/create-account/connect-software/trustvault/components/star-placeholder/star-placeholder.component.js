import React, { PureComponent } from 'react'
import classnames from 'classnames'

const CLASSNAME_STAR_PLACEHOLDER = 'star-placeholder'
const CLASSNAME_INLINE_BLOCK = 'inline-block-child'

export default class StarPlaceholder extends PureComponent {
  render() {
    return (
      <span
        className={classnames(CLASSNAME_STAR_PLACEHOLDER, CLASSNAME_INLINE_BLOCK)}
      >
      ﹡
      </span>
    );
  }
}
