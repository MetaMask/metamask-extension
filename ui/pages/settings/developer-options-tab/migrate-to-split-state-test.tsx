import React from 'react';
import { useDispatch } from 'react-redux';
import { migrateToSplitState } from '../../../store/actions';

const MigrateToSplitStateTest = () => {
  const dispatch = useDispatch();

  const handleMigrate = async () => {
    if (
      confirm(
        "Are you sure you want to migrate to split state? You can't undo this action.",
      )
    ) {
      await dispatch(migrateToSplitState());
    }
  };
  return (
    <div>
      <button
        className="button btn-primary"
        style={{ marginTop: '16px' }}
        onClick={handleMigrate}
      >
        Migrate to Split State
      </button>
    </div>
  );
};

export default MigrateToSplitStateTest;
