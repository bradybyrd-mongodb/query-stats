import React from 'react';

const RunIdSelector = ({ runIds, selectedRunId, onRunIdChange, loading }) => {
  // Debug logging
  console.log('RunIdSelector received runIds:', runIds);
  console.log('RunIds type:', typeof runIds, 'Array?', Array.isArray(runIds));
  console.log('RunIds length:', runIds?.length);
  console.log('First few runIds:', runIds?.slice(0, 3));

  // Helper function to extract the original run_id from the formatted string
  const extractRunId = (formattedRunId) => {
    if (!formattedRunId) return null;
    // Split by " | " and take the first part (the original run_id)
    return formattedRunId.split(' | ')[0];
  };

  return (
    <div className="run-id-selector">
      <h3>Run ID Filter</h3>
      <div className="form-group">
        <label htmlFor="run-id-select">Select Run ID:</label>
        <select
          id="run-id-select"
          className="run-id-select"
          value={selectedRunId || ''}
          onChange={(e) => onRunIdChange(extractRunId(e.target.value) || null)}
          disabled={loading}
        >
          <option value="">All Runs</option>
          {runIds.map((runId, index) => {
            console.log(`Option ${index}:`, runId, 'type:', typeof runId, 'length:', runId?.length);
            return (
              <option key={runId || index} value={runId}>
                {runId || `[Empty ${index}]`}
              </option>
            );
          })}
        </select>
      </div>
      
      {runIds.length > 0 && (
        <div className="run-id-info">
          <small>{runIds.length} run{runIds.length !== 1 ? 's' : ''} available</small>
        </div>
      )}
      
      {runIds.length === 0 && !loading && (
        <div className="run-id-info">
          <small style={{ color: '#999', fontStyle: 'italic' }}>
            No run IDs found in stats_output collection
          </small>
        </div>
      )}
    </div>
  );
};

export default RunIdSelector;
