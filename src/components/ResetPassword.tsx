/// <reference types="react" />
import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const ResetPassword = () => {
    const history = useHistory();
    const query = new URLSearchParams(useLocation().search);

    // 🎯 REPARAT: Extragem doar token-ul. Email-ul nu mai este trimis în link pentru securitate sporită
    const token = query.get('token');

    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        try {
            // 🎯 REPARAT: Trimitem exact structura cerută de ResetPasswordDto din backend
            const response = await fetch('https://localhost:7104/api/Auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    newPassword: password
                })
            });

            if (response.ok) {
                setMessage("🎉 Password has been reset successfully! Redirecting to login...");
                setTimeout(() => {
                    history.push('/login');
                }, 3000);
            } else {
                const errText = await response.text();
                setError(errText || "Something went wrong. The link might be expired.");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: '#141414', border: '1px solid #222', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>

                <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '28px', fontWeight: 'bold' }}>Reset Password</h2>
                <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '25px' }}>Enter your new secure password below.</p>

                {error && <div style={{ color: '#ff4d4d', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>⚠️ {error}</div>}
                {message && <div style={{ color: '#ccff00', backgroundColor: 'rgba(204, 255, 0, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>{message}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #222', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e: any) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #222', background: '#1c1c1c', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: '#ccff00', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' }}
                    >
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;