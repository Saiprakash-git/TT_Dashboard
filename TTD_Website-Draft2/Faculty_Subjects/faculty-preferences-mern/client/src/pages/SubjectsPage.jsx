import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.data);
    } catch (err) {
      setError('Failed to load subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1>All Subjects</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card mt-3">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
                <th>Semester</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No subjects available
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject._id}>
                    <td><strong>{subject.code}</strong></td>
                    <td>{subject.name}</td>
                    <td>{subject.credits}</td>
                    <td>{subject.semester || '-'}</td>
                    <td>{subject.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default SubjectsPage;
