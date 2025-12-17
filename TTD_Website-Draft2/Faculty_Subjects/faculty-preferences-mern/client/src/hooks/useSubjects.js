import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/subjects');
      setSubjects(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchSubjects();
  };

  return {
    subjects,
    isLoading,
    error,
    refetch
  };
}
