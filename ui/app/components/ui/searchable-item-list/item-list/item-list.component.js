import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function SearchableItemList ({
  results = [],
  onToggleItem = null,
  Placeholder = null,
  listTitle = '',
}) {
  return results.length === 0
    ? <Placeholder />
    : (
      <div className="searchable-item-list">
        {listTitle && (
          <div className="searchable-item-list__title">
            { listTitle }
          </div>
        )}
        <div className="searchable-item-list__list-container">
          {
            results.slice(0, 6)
              .map((result, i) => {
                const { backgroundImageUrl, selected, disabled, primaryLabel } = result

                return (
                  <div
                    className={classnames('searchable-item-list__item', {
                      'searchable-item-list__item--selected': selected,
                      'searchable-item-list__item--disabled': disabled,
                    })}
                    onClick={() => onToggleItem && onToggleItem(result)}
                    key={`searchable-item-list-item-${i}`}
                  >
                    <div
                      className="searchable-item-list__item-icon"
                      style={{ backgroundImage: backgroundImageUrl && `url(${backgroundImageUrl})` }}
                    />
                    <div className="searchable-item-list__item-labels">
                      {primaryLabel && <span className="searchable-item-list__primary-label">{ primaryLabel }</span>}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    )
}

SearchableItemList.propTypes = {
  results: PropTypes.array,
  onToggleItem: PropTypes.func,
  Placeholder: PropTypes.element,
  listTitle: PropTypes.string,
}
