import React from 'react';

const Header = ({ serverStatus }) => {
  return (
    <div className="header">
      <h1>MongoDB QueryStats Viewer</h1>
      <div className="server-status">
        <div className={`status-indicator ${serverStatus?.connected ? '' : 'disconnected'}`}></div>
        <span>
          {serverStatus?.connected ? 'Connected' : 'Disconnected'} 
          {serverStatus?.database && ` to ${serverStatus.database}`}
        </span>
      </div>
    </div>
  );
};

export default Header;
