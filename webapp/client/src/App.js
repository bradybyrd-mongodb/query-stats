import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import CollectionSelector from './components/CollectionSelector';
import RunIdSelector from './components/RunIdSelector';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import './App.css';

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

function App() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [runIds, setRunIds] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  });
  const [serverStatus, setServerStatus] = useState(null);

  // Fetch server health, collections, and run IDs on mount
  useEffect(() => {
    fetchServerHealth();
    fetchCollections();
    fetchRunIds();
  }, []);

  const fetchServerHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      setServerStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch server health:', error);
      setError('Failed to connect to server');
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/collections`);
      if (response.data.success) {
        setCollections(response.data.collections);
        // Auto-select first collection if available
        if (response.data.collections.length > 0 && !selectedCollection) {
          setSelectedCollection(response.data.collections[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setError('Failed to fetch collections');
    }
  };

  const fetchRunIds = async () => {
    try {
      console.log('Fetching run IDs from API...');
      const response = await axios.get(`${API_BASE}/run-ids`);
      console.log('Run IDs API response:', response.data);

      if (response.data.success) {
        console.log('Setting run IDs:', response.data.runIds);
        setRunIds(response.data.runIds);
      } else {
        console.error('API returned success: false', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch run IDs:', error);

      // Try the simple endpoint as fallback
      try {
        console.log('Trying simple run-ids endpoint...');
        const fallbackResponse = await axios.get(`${API_BASE}/run-ids-simple`);
        console.log('Simple run IDs response:', fallbackResponse.data);

        if (fallbackResponse.data.success) {
          setRunIds(fallbackResponse.data.runIds);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

  const fetchData = async (collection, page = 1, limit = 50, runId = null) => {
    if (!collection) return;

    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * limit;

      // If we have a run_id filter and we're looking at stats_output collection, use search endpoint
      if (runId && collection === 'stats_output') {
        const response = await axios.post(`${API_BASE}/search/${collection}`, {
          query: { run_id: runId },
          limit,
          skip,
          sort: '_id',
          order: 'desc'
        });

        if (response.data.success) {
          setData(response.data.data);
          // Generate headers from the first document if available
          if (response.data.data.length > 0) {
            setHeaders(Object.keys(response.data.data[0]));
          }
          setPagination({
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            totalCount: response.data.totalCount,
            limit: response.data.limit
          });
        }
      } else {
        // Regular data fetch without filtering
        const response = await axios.get(`${API_BASE}/data/${collection}`, {
          params: { limit, skip, sort: '_id', order: 'desc' }
        });

        if (response.data.success) {
          setData(response.data.data);
          setHeaders(response.data.headers);
          setPagination({
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            totalCount: response.data.totalCount,
            limit: response.data.limit
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(`Failed to fetch data from ${collection}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionChange = (collection) => {
    setSelectedCollection(collection);
    setData([]);
    setHeaders([]);
    setPagination({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 50 });
    fetchData(collection, 1, 50, selectedRunId);
  };

  const handleRunIdChange = (runId) => {
    setSelectedRunId(runId);
    setData([]);
    setHeaders([]);
    setPagination({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 50 });
    if (selectedCollection) {
      fetchData(selectedCollection, 1, 50, runId);
    }
  };

  const handlePageChange = (page) => {
    fetchData(selectedCollection, page, pagination.limit, selectedRunId);
  };

  return (
    <div className="App">
      <Header serverStatus={serverStatus} />
      
      <div className="main-content">
        <div className="sidebar">
          <RunIdSelector
            runIds={runIds}
            selectedRunId={selectedRunId}
            onRunIdChange={handleRunIdChange}
            loading={loading}
          />

          <CollectionSelector
            collections={collections}
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
          />
        </div>
        
        <div className="content">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          {loading && <LoadingSpinner />}
          
          {!loading && data.length > 0 && (
            <DataTable
              data={data}
              headers={headers}
              collection={selectedCollection}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
          
          {!loading && data.length === 0 && selectedCollection && !error && (
            <div className="empty-state">
              <h3>No data found</h3>
              <p>The collection "{selectedCollection}" appears to be empty.</p>
            </div>
          )}
          
          {!selectedCollection && !loading && (
            <div className="welcome-state">
              <h2>Welcome to MongoDB QueryStats Viewer</h2>
              <p>Select a collection from the sidebar to view its data, or execute queryStats to see live query performance metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
