import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Banner, Empty, PageHeader, SkeletonCards } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { ago, initials } from '../../utils';

export default function People() {
  useTitle('People');
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/auth/students')
      .then((data) => setStudents(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => students.filter((student) => {
    const hay = `${student.name} ${student.email} ${student.department || ''} ${student.enrollmentId || ''}`.toLowerCase();
    return !query || hay.includes(query.toLowerCase());
  }), [students, query]);

  return (
    <div className="page">
      <PageHeader kicker="People" title="Students" lede="Open someone to see their scores, the rolling average, and topics under 60%." />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <label className="search">
        <span className="sr">Search students</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or department" />
      </label>
      {loading ? <SkeletonCards /> : visible.length === 0 ? (
        <Empty title={students.length ? 'Nobody matches' : 'No students yet'} body={students.length ? 'Try another spelling.' : 'When a student creates an account, they show up here.'} />
      ) : (
        <div className="grid-cards">
          {visible.map((student) => (
            <Link key={student._id} to={`/host/people/${student._id}`} className="card card-hover person-card">
              <span className="avatar lg">{initials(student.name)}</span>
              <h3>{student.name}</h3>
              <p className="fine">{student.email}</p>
              <p className="fine">{student.department || 'No department'}{student.semester ? ` · semester ${student.semester}` : ''}</p>
              <p className="fine">Joined {ago(student.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
