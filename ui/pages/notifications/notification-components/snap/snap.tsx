import React from 'react';
import classnames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import type { SnapNotification } from '../../snap/types/types';
import { SnapUIMarkdown } from '../../../../components/app/snaps/snap-ui-markdown';
import { formatDate, getSnapRoute } from '../../../../helpers/utils/util';
import { getSnapMetadata } from '../../../../selectors';
import { markNotificationsAsRead } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Button from '../../../../components/ui/button';

type SnapComponentProps = {
  snapNotification: SnapNotification;
};

function NotificationItem({ snapNotification }: SnapComponentProps) {
  const { message, origin, createdDate, readDate } = snapNotification.data;
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();

  const { name: snapName } = useSelector((state) =>
    // @ts-expect-error params only expect 1 argument not 2
    getSnapMetadata(state, origin),
  );

  const handleNameClick = (e: Pick<Event, 'stopPropagation'>) => {
    e.stopPropagation();
    dispatch(markNotificationsAsRead([snapNotification.id]));
    history.push(getSnapRoute(origin));
  };

  const handleItemClick = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
  };

  return (
    <div className="snap-notifications__item" onClick={handleItemClick}>
      <div
        className={classnames(
          'snap-notifications__item__unread-dot',
          // @ts-expect-error classnames only accept strings and Record<strings>, this shorthand is not allowed
          !readDate && 'unread',
        )}
      />
      <div className="snap-notifications__item__details">
        <div className="snap-notifications__item__details__message">
          <SnapUIMarkdown markdown>{message}</SnapUIMarkdown>
        </div>
        <p className="snap-notifications__item__details__infos">
          {t('notificationsInfos', [
            formatDate(createdDate, "LLLL d',' yyyy 'at' t"),
            // @ts-expect-error Using deprecated button that has bad types for onClick
            <Button type="inline" onClick={handleNameClick} key="button">
              {snapName}
            </Button>,
          ])}
        </p>
      </div>
    </div>
  );
}

export const SnapComponent = ({ snapNotification }: SnapComponentProps) => {
  return <NotificationItem snapNotification={snapNotification} />;
};
