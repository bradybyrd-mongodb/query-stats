import React from 'react';

const ErrorMessage = ({ message, onClose }) => {
  return (
    <div className="error-message">
      <span>{message}</span>
      <button className="error-close" onClick={onClose} title="Close">
        ×
      </button>
    </div>
  );
};

export default ErrorMessage;
