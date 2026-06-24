// src/components/AddTrainerAdminTab.tsx
/// <reference types="react" />
import React from 'react';

const AddTrainerAdminTab = () => {
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        specialization: '',
        yearsOfExperience: '',
        companyId: localStorage.getItem('companyId') || '1', // 🎯 Dinamicizare: pornește cu sediul curent selectat
        accountType: 'Trainer'
    });
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        if (name === 'phoneNumber') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, [name]: onlyNums });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const targetCompanyId = parseInt(formData.companyId, 10) || 1;

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            specialization: formData.specialization || 'General',
            yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : 0,
            companyId: targetCompanyId
        };

        const apiUrl = formData.accountType === 'Admin'
            ? 'https://localhost:7104/odata/Admins'
            : 'https://localhost:7104/api/Trainers';

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // 🎯 REPARARE CITIRE RĂSPUNS: Încercăm să parsăm JSON-ul trimis de backend ({ message: "..." })
                try {
                    const data = await response.json();
                    setMessage(data.message || `The ${formData.accountType} account has been successfully registered to the selected gym branch!`);
                } catch (jsonErr) {
                    setMessage(`The ${formData.accountType} account has been successfully registered to the selected gym branch!`);
                }

                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phoneNumber: '',
                    specialization: '',
                    yearsOfExperience: '',
                    companyId: formData.companyId,
                    accountType: formData.accountType
                });
            } else {
                const errText = await response.text();
                setError(errText || 'An error occurred while saving data.');
            }
        } catch (err) {
            setError('Could not connect to the server. Please verify if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-card" style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #222', maxWidth: '500px' }}>
            <h3 style={{ color: '#ccff00', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 GymFit Staff Management
            </h3>

            {message && <div style={{ color: '#ccff00', backgroundColor: 'rgba(204,255,0,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>✔️ {message}</div>}
            {error && <div style={{ color: '#ff4d4d', backgroundColor: 'rgba(255,77,77,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* 🔘 ACCOUNT TYPE SELECTION */}
                <div>
                    <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Account Type</label>
                    <div style={{ display: 'flex', gap: '15px', background: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #333' }}>
                        <label style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="accountType" value="Trainer" checked={formData.accountType === 'Trainer'} onChange={handleChange} style={{ accentColor: '#ccff00' }} />
                            Add Trainer
                        </label>
                        <label style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="accountType" value="Admin" checked={formData.accountType === 'Admin'} onChange={handleChange} style={{ accentColor: '#ccff00' }} />
                            Add Administrator
                        </label>
                    </div>
                </div>

                {/* 📍 GYM LOCATION BRANCH */}
                <div>
                    <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Assigned Gym Location (City)</label>
                    <select name="companyId" value={formData.companyId} onChange={handleChange} style={inputStyle}>
                        <option value="1">GymFit Timișoara (Headquarters)</option>
                        <option value="2">GymFit Cluj-Napoca</option>
                        <option value="3">GymFit București</option>
                    </select>
                </div>

                {/* FIRST NAME & LAST NAME ROW */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>First Name</label>
                        <input type="text" name="firstName" placeholder="e.g. John" value={formData.firstName} onChange={handleChange} required autoComplete="off" style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Last Name</label>
                        <input type="text" name="lastName" placeholder="e.g. Doe" value={formData.lastName} onChange={handleChange} required autoComplete="off" style={inputStyle} />
                    </div>
                </div>

                {/* EMAIL ADDRESS */}
                <div>
                    <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Email Address</label>
                    <input type="email" name="email" placeholder="e.g. john.doe@gymfit.com" value={formData.email} onChange={handleChange} required autoComplete="none" style={inputStyle} />
                </div>

                {/* TEMPORARY PASSWORD */}
                <div>
                    <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Temporary Password</label>
                    <input type="password" name="password" placeholder="Enter a secure temporary password" value={formData.password} onChange={handleChange} required autoComplete="new-password" style={inputStyle} />
                </div>

                {/* PHONE NUMBER */}
                <div>
                    <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Phone Number</label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="e.g. 0722123456"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        autoComplete="off"
                        style={inputStyle}
                    />
                </div>

                {/* CONDITIONAL FIELDS FOR TRAINER ONLY */}
                {formData.accountType === 'Trainer' && (
                    <>
                        <div>
                            <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Specialization</label>
                            <input type="text" name="specialization" placeholder="e.g. Bodybuilding, Yoga, CrossFit" value={formData.specialization} onChange={handleChange} required={formData.accountType === 'Trainer'} autoComplete="off" style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'block' }}>Years of Experience</label>
                            <input type="number" name="yearsOfExperience" placeholder="e.g. 5" min="0" max="60" value={formData.yearsOfExperience} onChange={handleChange} required={formData.accountType === 'Trainer'} autoComplete="off" style={inputStyle} />
                        </div>
                    </>
                )}

                <button type="submit" disabled={loading} style={{ background: '#ccff00', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    {loading ? 'Saving to system...' : `Register ${formData.accountType}`}
                </button>
            </form>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box' as const
};

export default AddTrainerAdminTab;