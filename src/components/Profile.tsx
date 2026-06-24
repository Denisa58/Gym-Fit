// src/components/Profile.tsx
/// <reference types="react" />
import React from 'react';
import { useHistory } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const history = useHistory();

    const userId = localStorage.getItem('userId') || localStorage.getItem('id') || '1';
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');

    // Preluăm rolul direct din localStorage pentru verificarea de drepturi
    const role = localStorage.getItem('role') || localStorage.getItem('userRole') || 'Client';

    const companyName = localStorage.getItem('companyName') || 'GymFit Timișoara';
    const companyLocation = localStorage.getItem('companyLocation') || '';

    const getNameFromToken = (jwtToken: any) => {
        if (!jwtToken) return '';
        try {
            const base64Url = jwtToken.split('.')[1];
            if (!base64Url) return '';
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(atob(base64));
            return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.unique_name || '';
        } catch (e) {
            return '';
        }
    };

    const getBestAvailableEmail = () => {
        const directEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
        if (directEmail && directEmail.includes('@')) return directEmail;
        return role === 'Admin' ? 'admin@gymfit.com' : 'trainer@gymfit.com';
    };

    const tokenName = getNameFromToken(token);
    const localUserName = localStorage.getItem('userName') || tokenName || localStorage.getItem('name') || (role === 'Admin' ? 'Administrator' : 'Gym Trainer');
    const localEmail = getBestAvailableEmail();

    const [userData, setUserData] = React.useState({
        firstName: localUserName.split(' ')[0] || '',
        lastName: localUserName.split(' ').slice(1).join(' ') || '',
        email: localEmail
    });

    // 🎯 REPARAT LOGIC: Nu mai punem fallback pe o cale fizică de client.
    // Dacă nu există o imagine încărcată pentru acest userId, pornește cu null.
    const [profilePic, setProfilePic] = React.useState(() => {
        return localStorage.getItem(`profilePic_${userId}`) || null;
    });

    React.useEffect(() => {
        setUserData({
            firstName: localUserName.split(' ')[0] || '',
            lastName: localUserName.split(' ').slice(1).join(' ') || '',
            email: localEmail
        });
    }, [localUserName, localEmail, role]);

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                localStorage.setItem(`profilePic_${userId}`, base64String);
                setProfilePic(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        history.push('/login');
    };

    const fullName = userData.firstName || userData.lastName
        ? `${userData.firstName} ${userData.lastName}`.trim()
        : localUserName;

    const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : 'G';

    const menuItems = [
        { id: 'info', label: 'Informații personale', icon: '👤' },
        { id: 'billing', label: 'Detalii de facturare', icon: '💳' },
        { id: 'account', label: 'Gestionare Cont', icon: '📱' },
        { id: 'subs', label: 'Abonamente Recurente', icon: '📅' },
        { id: 'classes', label: 'Clase', icon: '✅' },
        { id: 'invoices', label: 'Facturi', icon: '📄' },
        { id: 'history', label: 'Istoric Prezență', icon: '🕒' },
    ];

    const getTopNavBtnStyle = (tabName: string) => {
        const isActive = tabName === 'profile';
        return {
            padding: '8px 16px',
            background: 'transparent',
            color: isActive ? '#ccff00' : '#aaa',
            border: 'none',
            borderBottom: isActive ? '3px solid #ccff00' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold' as const,
            fontSize: '15px',
            transition: 'all 0.2s ease',
        };
    };

    // Verificăm corect dacă avem string de imagine valid înainte de a face concatenarea URL-ului
    const profileImageUrl = profilePic
        ? (profilePic.startsWith('data:') || profilePic.startsWith('http') ? profilePic : `https://localhost:7104${profilePic}`)
        : null;

    return (
        <div className="home-page-wrapper">
            <nav className="top-navbar">
                <div className="navbar-brand" onClick={() => history.push('/home')} style={{ cursor: 'pointer' }}>
                    <span className="brand-icon">🏋️</span>
                    <span className="brand-text">GymFit</span>
                </div>
                <div className="navbar-navigation" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => history.push('/home')} style={getTopNavBtnStyle('dashboard')}>Home</button>

                    {role === 'Client' && (
                        <button
                            onClick={() => history.push({ pathname: '/home', state: { targetTab: 'memberships' } })}
                            style={getTopNavBtnStyle('memberships')}
                        >
                            Memberships
                        </button>
                    )}

                    <button onClick={() => history.push('/profile')} style={getTopNavBtnStyle('profile')}>Profile</button>

                    {role === 'Admin' && (
                        <>
                            <button onClick={() => history.push({ pathname: '/home', state: { targetTab: 'rooms' } })}
                                    style={getTopNavBtnStyle('rooms')}>Rooms
                            </button>
                            <button onClick={() => history.push({ pathname: '/home', state: { targetTab: 'add-trainer' } })}
                                    style={getTopNavBtnStyle('add-trainer')}>New Trainer
                            </button>
                            <button onClick={() => history.push({
                                pathname: '/home',
                                state: { targetTab: 'manage-memberships' }
                            })} style={getTopNavBtnStyle('manage-memberships')}>Manage Memberships
                            </button>
                        </>
                    )}

                    <div style={{ marginLeft: '10px', padding: '4px 12px', backgroundColor: 'rgba(204, 255, 0, 0.1)', border: '1px solid #ccff00', borderRadius: '20px', color: '#ccff00', fontSize: '13px', fontWeight: 'bold' }}>
                        📍 {companyName}
                    </div>
                </div>
                <div className="navbar-user-actions">
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </nav>

            <main className="gym-profile-content-area">
                <div className="gym-profile-horizontal-grid">
                    <div className="gym-profile-left-panel">
                        <div className="gym-clean-hero-card">
                            <div className="gym-avatar-main-view">
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="Profile" className="gym-avatar-img-element" />
                                ) : (
                                    <div className="gym-avatar-placeholder-element">{initialLetter}</div>
                                )}
                                <label className="gym-change-photo-badge">
                                    📷
                                    <input type="file" accept="image/*" onChange={handleImageChange}
                                           style={{ display: 'none' }} />
                                </label>
                            </div>

                            <h2 className="gym-profile-name-text">{fullName}</h2>
                            <p className="gym-profile-email-text" style={{ marginBottom: '15px' }}>{userData.email}</p>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', marginTop: '5px', textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ccff00' }}>{companyName}</div>
                                {companyLocation && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{companyLocation}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="gym-profile-right-panel">
                        <div className="gym-options-section">
                            <h3 className="gym-options-heading">CONTUL MEU</h3>
                            <div className="gym-options-list">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="gym-options-row"
                                         onClick={() => console.log(`Navigăm la ${item.id}`)}>
                                        <div className="gym-options-row-left">
                                            <span className="gym-option-icon">{item.icon}</span>
                                            <span className="gym-option-text">{item.label}</span>
                                        </div>
                                        <span className="gym-option-arrow">›</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;