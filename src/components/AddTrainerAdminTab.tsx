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
            : 'https://localhost:7104/odata/Trainers';

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
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
            minHeight: 'calc(100vh - 100px)',
            backgroundColor: '#0a0a0a'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '540px',
                backgroundColor: '#141414',
                borderRadius: '16px',
                padding: '35px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                border: '1px solid #222'
            }}>
                <h3 style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 25px 0',
                    textAlign: 'center',
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    👥 Create Staff Account
                </h3>

                {message && <div style={{ color: '#ccff00', backgroundColor: 'rgba(204,255,0,0.1)', padding: '12px 16px', border: '1px solid rgba(204,255,0,0.2)', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>✔️ {message}</div>}
                {error && <div style={{ color: '#ff4d4d', backgroundColor: 'rgba(255,77,77,0.1)', padding: '12px 16px', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>⚠️ {error}</div>}

                <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 🔘 ACCOUNT TYPE SELECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Account Type</label>
                        <div style={{ display: 'flex', gap: '20px', background: '#1f1f1f', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                            <label style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                                <input type="radio" name="accountType" value="Trainer" checked={formData.accountType === 'Trainer'} onChange={handleChange} style={{ accentColor: '#ccff00', width: '16px', height: '16px' }} />
                                Add Trainer
                            </label>
                            <label style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                                <input type="radio" name="accountType" value="Admin" checked={formData.accountType === 'Admin'} onChange={handleChange} style={{ accentColor: '#ccff00', width: '16px', height: '16px' }} />
                                Add Administrator
                            </label>
                        </div>
                    </div>

                    {/* 📍 GYM LOCATION BRANCH */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Assigned Gym Location (City)</label>
                        <select name="companyId" value={formData.companyId} onChange={handleChange} style={inputStyle}>
                            <option value="1" style={{ backgroundColor: '#141414' }}>GymFit Timișoara (Headquarters)</option>
                            <option value="2" style={{ backgroundColor: '#141414' }}>GymFit Cluj-Napoca</option>
                            <option value="3" style={{ backgroundColor: '#141414' }}>GymFit București</option>
                        </select>
                    </div>

                    {/* FIRST NAME & LAST NAME ROW */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={labelStyle}>First Name</label>
                            <input type="text" name="firstName" placeholder="e.g. John" value={formData.firstName} onChange={handleChange} required autoComplete="off" style={inputStyle} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={labelStyle}>Last Name</label>
                            <input type="text" name="lastName" placeholder="e.g. Doe" value={formData.lastName} onChange={handleChange} required autoComplete="off" style={inputStyle} />
                        </div>
                    </div>

                    {/* EMAIL ADDRESS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Email Address</label>
                        <input type="email" name="email" placeholder="e.g. john.doe@gymfit.com" value={formData.email} onChange={handleChange} required autoComplete="none" style={inputStyle} />
                    </div>

                    {/* TEMPORARY PASSWORD */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Temporary Password</label>
                        <input type="password" name="password" placeholder="Enter a secure temporary password" value={formData.password} onChange={handleChange} required autoComplete="new-password" style={inputStyle} />
                    </div>

                    {/* PHONE NUMBER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Phone Number</label>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={labelStyle}>Specialization</label>
                                <input type="text" name="specialization" placeholder="e.g. Bodybuilding, Yoga, CrossFit" value={formData.specialization} onChange={handleChange} required={formData.accountType === 'Trainer'} autoComplete="off" style={inputStyle} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={labelStyle}>Years of Experience</label>
                                <input type="number" name="yearsOfExperience" placeholder="e.g. 5" min="0" max="60" value={formData.yearsOfExperience} onChange={handleChange} required={formData.accountType === 'Trainer'} autoComplete="off" style={inputStyle} />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#ccff00',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginTop: '10px',
                            transition: 'background-color 0.2s, opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#b2df00'; }}
                        onMouseLeave={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#ccff00'; }}
                    >
                        {loading ? 'Saving to system...' : `Register ${formData.accountType}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

const labelStyle = {
    color: '#aaa',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#1f1f1f',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const
};

export default AddTrainerAdminTab;