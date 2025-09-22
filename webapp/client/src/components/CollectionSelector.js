import React from 'react';

const CollectionSelector = ({ collections, selectedCollection, onCollectionChange }) => {
  return (
    <div className="collection-selector">
      <h3>Collections</h3>
      <ul className="collection-list">
        {collections.map((collection) => (
          <li
            key={collection}
            className={`collection-item ${selectedCollection === collection ? 'selected' : ''}`}
            onClick={() => onCollectionChange(collection)}
          >
            {collection}
          </li>
        ))}
      </ul>
      {collections.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No collections found</p>
      )}
    </div>
  );
};

export default CollectionSelector;
