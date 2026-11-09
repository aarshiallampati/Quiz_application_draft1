import { useEffect, useState } from 'react';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch all users with role=student from backend
                const response = await API.get('/auth/students');
                const data = response.data;
                setStudents(Array.isArray(data) ? data : data.students || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0"><i className="bi bi-people me-2"></i>Students</h3>
                <span className="badge bg-primary fs-6">{students.length} Enrolled</span>
            </div>

            {students.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-person-x fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No students found.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle bg-white shadow-sm rounded">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Semester</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => (
                                <tr key={s._id || i}>
                                    <td>{i + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: 32, height: 32 }}>
                                                <span className="fw-bold small">{(s.name || 'S')[0].toUpperCase()}</span>
                                            </div>
                                            <span className="fw-semibold">{s.name}</span>
                                        </div>
                                    </td>
                                    <td>{s.email}</td>
                                    <td>{s.department || '—'}</td>
                                    <td>{s.semester || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
