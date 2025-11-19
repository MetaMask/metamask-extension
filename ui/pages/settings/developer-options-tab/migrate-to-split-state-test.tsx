import React from 'react';
import { useDispatch } from 'react-redux';
import { migrateToSplitState } from '../../../store/actions';

function MigrateToSplitStateTest() {
  const dispatch = useDispatch();

  const handleMigrate = async () => {
    await dispatch(migrateToSplitState());
  };
  return (
    <div>
      <button onClick={handleMigrate}>Migrate to Split State</button>
    </div>
  );
}

export default MigrateToSplitStateTest;
