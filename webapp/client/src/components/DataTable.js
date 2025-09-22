import React, { useState } from 'react';

const DataTable = ({ data, headers, collection, pagination, onPageChange }) => {
  const [expandedCells, setExpandedCells] = useState(new Set());

  const toggleCellExpansion = (rowIndex, header) => {
    const cellKey = `${rowIndex}-${header}`;
    const newExpanded = new Set(expandedCells);
    
    if (newExpanded.has(cellKey)) {
      newExpanded.delete(cellKey);
    } else {
      newExpanded.add(cellKey);
    }
    
    setExpandedCells(newExpanded);
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    if (typeof value === 'boolean') {
      return value.toString();
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= pagination.totalPages) {
        onPageChange(page);
      }
    }
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>{collection}</h2>
        <div className="table-info">
          {pagination.totalCount.toLocaleString()} total records
        </div>
      </div>
      
      <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header) => {
                  const cellKey = `${rowIndex}-${header}`;
                  const isExpanded = expandedCells.has(cellKey);
                  const value = row[header];
                  const formattedValue = formatCellValue(value);
                  
                  return (
                    <td key={header}>
                      <div
                        className={`cell-content ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleCellExpansion(rowIndex, header)}
                        title="Click to expand/collapse"
                      >
                        {formattedValue}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
            {' '}({pagination.totalCount.toLocaleString()} total records)
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              First
            </button>
            
            <button
              className="pagination-button"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            
            <input
              type="number"
              className="page-input"
              min="1"
              max={pagination.totalPages}
              defaultValue={pagination.currentPage}
              onKeyPress={handlePageInput}
              title="Press Enter to go to page"
            />
            
            <button
              className="pagination-button"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </button>
            
            <button
              className="pagination-button"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
