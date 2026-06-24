// src/components/Register.tsx
/// <reference types="react" />
import React from 'react';
import { authService } from '../services/authService';
import { useHistory } from 'react-router-dom';
import './Register.css';

const Register = () => {
    // 📍 Pasul 3.1: Inițializăm companyId în starea formularului (implicit sediul 1)
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        companyId: '1'
    });

    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const history = useHistory();

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // 📍 Pasul 3.2: Mapăm și convertim companyId în format numeric (int) pentru backend
        const payload = {
            ...formData,
            companyId: parseInt(formData.companyId, 10) || 1
        };

        try {
            // Trimitem payload-ul corectat numeric către serviciul de autentificare
            await authService.register(payload);
            setSuccess('Account created successfully! Redirecting to login...');

            // După 2 secunde de succes, îl trimitem automat la Login
            setTimeout(() => {
                history.push('/login');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Registration failed. Email might be already in use.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">
                    GYM <span className="highlight">FIT</span>
                </h2>

                <p className="register-subtitle">
                    Create your account to get started.
                </p>

                {error && <div className="register-error">{error}</div>}
                {success && <div className="register-success">{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            className="form-input"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="0712345678"
                            required
                        />
                    </div>

                    {/* 📍 Pasul 3.3: Inserăm Dropdown-ul pentru selectarea Sediului/Orașului */}
                    <div className="form-group">
                        <label>Select Gym Location</label>
                        <select
                            name="companyId"
                            className="form-input"
                            style={{ background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}
                            value={formData.companyId}
                            onChange={handleChange}
                            required
                        >
                            <option value="1">GymFit Timișoara (Sediul Central)</option>
                            <option value="2">GymFit Cluj-Napoca</option>
                            <option value="3">GymFit București</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="login-redirect">
                    Already have an account?
                    <span className="login-link" onClick={() => history.push('/login')}>
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Register;