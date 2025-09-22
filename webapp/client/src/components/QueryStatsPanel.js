import React, { useState } from 'react';

const QueryStatsPanel = ({ onExecute, loading }) => {
  const [collection, setCollection] = useState('');
  const [transformIdentifiers, setTransformIdentifiers] = useState('');

  const handleExecute = () => {
    let identifiers = {};
    
    // Parse transform identifiers if provided
    if (transformIdentifiers.trim()) {
      try {
        identifiers = JSON.parse(transformIdentifiers);
      } catch (error) {
        alert('Invalid JSON in transform identifiers');
        return;
      }
    }
    
    // Add collection filter if specified
    if (collection.trim()) {
      identifiers.collection = collection.trim();
    }
    
    onExecute(identifiers);
  };

  return (
    <div className="querystats-panel">
      <h3>Execute QueryStats</h3>
      <div className="querystats-form">
        <div className="form-group">
          <label htmlFor="collection-filter">Collection Filter (optional):</label>
          <input
            id="collection-filter"
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="e.g., users"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="transform-identifiers">Transform Identifiers (JSON, optional):</label>
          <textarea
            id="transform-identifiers"
            value={transformIdentifiers}
            onChange={(e) => setTransformIdentifiers(e.target.value)}
            placeholder='{"command": "find", "queryShape": "..."}'
            disabled={loading}
          />
        </div>
        
        <button
          className="execute-button"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'Executing...' : 'Execute QueryStats'}
        </button>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p><strong>Tip:</strong> QueryStats shows query performance metrics from your MongoDB deployment.</p>
        <p>Use collection filter to see stats for specific collections only.</p>
      </div>
    </div>
  );
};

export default QueryStatsPanel;
