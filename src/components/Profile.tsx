/// <reference types="react" />
import React from 'react';
import { useHistory } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const history = useHistory();

    const userId = localStorage.getItem('userId') || localStorage.getItem('id') || '1';
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');

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
        email: localEmail,
        phoneNumber: ''
    });

    // Stări Dropdown-uri
    const [isInfoDropdownOpen, setIsInfoDropdownOpen] = React.useState(false);
    const [isMembershipDropdownOpen, setIsMembershipDropdownOpen] = React.useState(false);

    // Stări Date Abonament
    const [membershipName, setMembershipName] = React.useState('No Active Membership');
    const [daysLeft, setDaysLeft] = React.useState<number>(0);
    const [activationDate, setActivationDate] = React.useState<Date | null>(null);
    const [expirationDate, setExpirationDate] = React.useState<Date | null>(null);

    const [profilePic, setProfilePic] = React.useState(() => {
        return localStorage.getItem(`profilePic_${userId}`) || null;
    });

    React.useEffect(() => {
        const fetchUserProfileAndMembership = async () => {
            try {
                const activeToken = localStorage.getItem('token') || localStorage.getItem('userToken');

                const headersConfig = {
                    'Content-Type': 'application/json',
                    'Authorization': activeToken ? `Bearer ${activeToken}` : ''
                };

                // 🎯 REPARAT: Determinăm endpoint-ul corect în funcție de rol (Clients / Admins / Trainers)
                let odataPath = 'Clients';
                if (role === 'Admin') odataPath = 'Admins';
                else if (role === 'Trainer') odataPath = 'Trainers';

                const responseUser = await fetch(`https://localhost:7104/odata/${odataPath}(${userId})`, { headers: headersConfig });

                if (responseUser.ok) {
                    const data = await responseUser.json();

                    const dbProfilePic = data.profilePictureUrl || data.ProfilePictureUrl;
                    if (dbProfilePic) {
                        setProfilePic(dbProfilePic);
                        localStorage.setItem(`profilePic_${userId}`, dbProfilePic);
                    }

                    // Extragere număr de telefon
                    const extractedPhone = data.phoneNumber || data.PhoneNumber || data.phone || data.Phone || '';
                    setUserData(prev => ({
                        ...prev,
                        phoneNumber: extractedPhone
                    }));

                    // Logica de calcul a Abonamentului se rulează DOAR pentru Clienți
                    if (role === 'Client') {
                        const rawMembershipId = data.membershipId || data.MembershipId;
                        const dbActivatedAt = data.membershipActivatedAt || data.MembershipActivatedAt;

                        if (!rawMembershipId || rawMembershipId === 0 || !dbActivatedAt) {
                            setMembershipName("No Active Membership");
                            setDaysLeft(0);
                            setActivationDate(null);
                            setExpirationDate(null);
                        } else {
                            const parsedId = parseInt(rawMembershipId, 10);
                            const activeDate = new Date(dbActivatedAt);
                            setActivationDate(activeDate);

                            let durationMonths = 1;
                            let currentFetchedName = "Active Membership";

                            try {
                                const mResponse = await fetch(`https://localhost:7104/odata/Memberships(${parsedId})`, { headers: headersConfig });
                                if (mResponse.ok) {
                                    const mData = await mResponse.json();
                                    currentFetchedName = mData.name || mData.Name || "Active Membership";
                                    setMembershipName(currentFetchedName);

                                    const foundDuration = mData.DurationMonths ?? mData.durationMonths ?? mData.PeriodMonths ?? mData.periodMonths;
                                    if (foundDuration !== undefined && foundDuration !== null) {
                                        durationMonths = parseInt(foundDuration, 10);
                                    }
                                }
                            } catch (errMembership) {
                                console.error("Eroare la preluarea detaliilor abonamentului:", errMembership);
                            }

                            const expiryDate = new Date(activeDate.getTime());
                            expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
                            setExpirationDate(expiryDate);

                            const diffTime = expiryDate.getTime() - new Date().getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            setDaysLeft(diffDays > 0 ? diffDays : 0);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching data from DB:", err);
            }
        };

        // 🎯 REPARAT: Lăsăm funcția să ruleze pentru TOATE rolurile, nu doar pentru Client
        fetchUserProfileAndMembership();
    }, [userId, role]);

    React.useEffect(() => {
        setUserData(prev => ({
            ...prev,
            firstName: localUserName.split(' ')[0] || '',
            lastName: localUserName.split(' ').slice(1).join(' ') || '',
            email: localEmail
        }));
    }, [localUserName, localEmail, role]);

    const handleImageChange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const activeToken = localStorage.getItem('token') || localStorage.getItem('userToken');

            let odataPath = 'Clients';
            if (role === 'Admin') odataPath = 'Admins';
            else if (role === 'Trainer') odataPath = 'Trainers';

            const response = await fetch(`https://localhost:7104/odata/${odataPath}(${userId})/upload-profile-picture`, {
                method: "POST",
                headers: {
                    "Authorization": activeToken ? `Bearer ${activeToken}` : ""
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setProfilePic(data.profilePictureUrl);
                localStorage.setItem(`profilePic_${userId}`, data.profilePictureUrl);
            } else {
                const errorText = await response.text();
                alert(`Error saving picture: ${errorText}`);
            }
        } catch (error) {
            console.error("Network error uploading image:", error);
            alert("Could not connect to the server for upload.");
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
                            <h3 className="gym-options-heading">MY ACCOUNT</h3>
                            <div className="gym-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                {/* Personal Information Dropdown */}
                                <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#111' }}>
                                    <div
                                        className="gym-options-row"
                                        onClick={() => setIsInfoDropdownOpen(!isInfoDropdownOpen)}
                                        style={{ margin: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <div className="gym-options-row-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="gym-option-icon">👤</span>
                                            <span className="gym-option-text" style={{ fontWeight: 'bold' }}>Personal Information</span>
                                        </div>
                                        <span style={{ transform: isInfoDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', fontSize: '18px', color: '#ccff00' }}>›</span>
                                    </div>

                                    {isInfoDropdownOpen && (
                                        <div style={{ padding: '15px', backgroundColor: '#161616', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Full Name:</strong> <span style={{ color: '#fff', marginLeft: '5px' }}>{fullName}</span></div>
                                            <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Email Address:</strong> <span style={{ color: '#fff', marginLeft: '5px' }}>{userData.email}</span></div>
                                            <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Phone Number:</strong> <span style={{ color: '#fff', marginLeft: '5px' }}>{userData.phoneNumber || 'Not provided'}</span></div>
                                        </div>
                                    )}
                                </div>

                                {/* Current Membership Dropdown */}
                                {role === 'Client' && (
                                    <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#111' }}>
                                        <div
                                            className="gym-options-row"
                                            onClick={() => setIsMembershipDropdownOpen(!isMembershipDropdownOpen)}
                                            style={{ margin: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span>💳</span>
                                                <span style={{ fontWeight: 'bold' }}>Current Membership</span>
                                            </div>
                                            <span style={{ transform: isMembershipDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', fontSize: '18px', color: '#ccff00' }}>›</span>
                                        </div>

                                        {isMembershipDropdownOpen && (
                                            <div style={{ padding: '15px', backgroundColor: '#161616', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Plan Name:</strong> <span style={{ color: '#ccff00', marginLeft: '5px', fontWeight: 'bold' }}>{membershipName}</span></div>

                                                {activationDate && (
                                                    <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Purchase Date:</strong> <span style={{ color: '#fff', marginLeft: '5px' }}>{activationDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                                                )}

                                                {expirationDate && (
                                                    <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Expiration Date:</strong> <span style={{ color: '#fff', marginLeft: '5px' }}>{expirationDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                                                )}

                                                <div style={{ fontSize: '14px', color: '#aaa' }}><strong>Days Remaining:</strong> <span style={{ color: daysLeft > 5 ? '#fff' : '#ff4444', marginLeft: '5px', fontWeight: 'bold' }}>{daysLeft} days</span></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;