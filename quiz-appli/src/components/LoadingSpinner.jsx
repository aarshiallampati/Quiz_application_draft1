export default function LoadingSpinner({ text = 'Loading…' }) {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center py-5 my-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">{text}</span>
            </div>
            <p className="mt-3 text-muted">{text}</p>
        </div>
    );
}
