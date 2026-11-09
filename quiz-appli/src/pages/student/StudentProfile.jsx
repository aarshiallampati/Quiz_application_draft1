import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        college: user?.college || '',
        department: user?.department || '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        // TODO: call authService.updateProfile(form)
        setEditing(false);
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                                    style={{ width: 70, height: 70 }}>
                                    <span className="fs-2 fw-bold">{(user?.name || 'S')[0].toUpperCase()}</span>
                                </div>
                                <h4 className="fw-bold mb-0">{user?.name || 'Student'}</h4>
                                <span className="badge bg-primary bg-opacity-10 text-primary text-capitalize mt-1">
                                    {user?.role}
                                </span>
                            </div>

                            <form onSubmit={handleSave}>
                                {[
                                    { label: 'Full Name', name: 'name', type: 'text' },
                                    { label: 'Email', name: 'email', type: 'email' },
                                    { label: 'College', name: 'college', type: 'text' },
                                    { label: 'Department', name: 'department', type: 'text' },
                                ].map((f) => (
                                    <div className="mb-3" key={f.name}>
                                        <label className="form-label">{f.label}</label>
                                        <input
                                            type={f.type}
                                            className="form-control"
                                            name={f.name}
                                            value={form[f.name]}
                                            onChange={handleChange}
                                            disabled={!editing}
                                        />
                                    </div>
                                ))}

                                <div className="d-flex gap-2">
                                    {editing ? (
                                        <>
                                            <button type="submit" className="btn btn-primary">
                                                <i className="bi bi-check2 me-1"></i>Save
                                            </button>
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-outline-primary" onClick={() => setEditing(true)}>
                                            <i className="bi bi-pencil me-1"></i>Edit Profile
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
