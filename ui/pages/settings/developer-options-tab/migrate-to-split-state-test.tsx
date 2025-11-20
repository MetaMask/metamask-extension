import React from 'react';
import { useDispatch } from 'react-redux';
import { migrateToSplitState } from '../../../store/actions';

const MigrateToSplitStateTest = () => {
  const dispatch = useDispatch();

  const handleMigrate = async () => {
    await dispatch(migrateToSplitState());
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
