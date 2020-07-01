import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function SearchableItemList ({
  results = [],
  onToggleItem = null,
  Placeholder = null,
  listTitle = '',
  maxListItems = 6,
  searchQuery = '',
}) {
  return results.length === 0
    ? <Placeholder searchQuery={searchQuery} />
    : (
      <div className="searchable-item-list">
        {listTitle && (
          <div className="searchable-item-list__title">
            { listTitle }
          </div>
        )}
        <div className="searchable-item-list__list-container">
          {
            results.slice(0, maxListItems)
              .map((result, i) => {
                const {
                  backgroundImageUrl,
                  selected,
                  disabled,
                  primaryLabel,
                  secondaryLabel,
                  rightPrimaryLabel,
                  rightSecondaryLabel,
                } = result

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
                    <div className="searchable-item-list__labels">
                      <div className="searchable-item-list__item-labels">
                        {primaryLabel && <span className="searchable-item-list__primary-label">{ primaryLabel }</span>}
                        {secondaryLabel && <span className="searchable-item-list__secondary-label">{ secondaryLabel }</span>}
                      </div>
                      {(rightPrimaryLabel || rightSecondaryLabel) && (
                        <div className="searchable-item-list__right-labels">
                          {rightPrimaryLabel && <span className="searchable-item-list__right-primary-label">{ rightPrimaryLabel }</span>}
                          {rightSecondaryLabel && <span className="searchable-item-list__right-secondary-label">{ rightSecondaryLabel }</span>}
                        </div>
                      )}
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
  maxListItems: PropTypes.number,
  searchQuery: PropTypes.string,
}
