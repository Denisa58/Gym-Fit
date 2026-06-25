/// <reference types="react" />
import React from 'react';
import { authService } from '../services/authService';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');

    const history = useHistory();

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const userData = await authService.login(email, password);
            console.log("User logged in successfully! Role:", userData.role, "CompanyName:", userData.companyName);

            if (email) {
                localStorage.setItem('userEmail', email.trim());
            }

            if (userData && userData.companyId !== undefined) {
                localStorage.setItem('companyId', userData.companyId.toString());
            }
            if (userData && userData.companyName) {
                localStorage.setItem('companyName', userData.companyName);
            }
            if (userData && userData.companyLocation) {
                localStorage.setItem('companyLocation', userData.companyLocation);
            }

            if (userData && userData.membershipActivatedAt) {
                localStorage.setItem(`membershipActivatedAt_${userData.userId}`, userData.membershipActivatedAt);
            } else if (userData) {
                localStorage.removeItem(`membershipActivatedAt_${userData.userId}`);
            }

            history.push('/home');
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    // 🎯 LOGICA NOUĂ: Ia mail-ul direct din câmpul de login și trimite cererea instant
    const handleDirectForgotPassword = async () => {
        setError('');
        setSuccessMessage('');

        if (!email || email.trim() === '') {
            setError("Please enter your email address in the field above first so we know where to send the link.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('https://localhost:7104/api/Auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });

            if (response.ok) {
                setSuccessMessage("📧 If the account exists, a reset link has been sent to this email!");
            } else {
                const errText = await response.text();
                setError(errText || "Could not send the recovery email.");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">
                    GYM <span className="highlight">FIT</span>
                </h2>

                <p className="login-subtitle">
                    Welcome back! Please enter your details.
                </p>

                {error && <div className="login-error">{error}</div>}
                {successMessage && <div style={{ color: '#ccff00', backgroundColor: 'rgba(204, 255, 0, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>{successMessage}</div>}

                <form onSubmit={handleLogin} name="loginFormForm" autoComplete="new-password">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="text"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="enter your email"
                            required
                            autoComplete="none"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="text"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="none"
                            style={{ WebkitTextSecurity: 'disc', MozTextSecurity: 'disc' }}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
                        <span
                            className="register-link"
                            style={{ fontSize: '13px', color: '#ff3333', cursor: 'pointer' }}
                            onClick={handleDirectForgotPassword}
                        >
                            Forgot Password?
                        </span>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>

                <p className="register-redirect">
                    Don't have an account?{' '}
                    <span className="register-link" onClick={() => history.push('/register')}>
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;