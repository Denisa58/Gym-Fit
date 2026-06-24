// src/components/AdminTrainerDashboard.tsx
/// <reference types="react" />
import React from 'react';
import SessionCard from './SessionCard';

const AdminTrainerDashboard = ({
                                   getActiveAndUpcomingSessions,
                                   workouts,
                                   rooms,
                                   role,
                                   handleEnrollSession,
                                   getTrainerNameById,
                                   renderEnrolledClientsList,
                                   setActiveTab,
                                   history
                               }: any) => {

    // 🎯 EXTRAGERE DIRECTĂ ȘI INDEPENDENTĂ ÎN INTERIORUL COMPONENTEI
    const getAbsoluteUserName = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const decoded = JSON.parse(window.atob(base64));
                    const jwtName =
                        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] ||
                        decoded.unique_name ||
                        decoded.name ||
                        decoded.email;

                    if (jwtName && jwtName !== 'undefined' && jwtName !== 'null') {
                        if (jwtName.includes('@')) {
                            return jwtName.split('@')[0].replace(/[._]/g, ' ');
                        }
                        return jwtName;
                    }
                }
            } catch (e) {}
        }

        const local = localStorage.getItem('userName');
        if (local && local !== 'User' && local !== 'undefined' && local !== 'null') return local;

        const email = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
        if (email.includes('@')) return email.split('@')[0].replace(/[._]/g, ' ');

        return 'Admin';
    };

    const displayUserName = getAbsoluteUserName();
    const storedCompanyId = localStorage.getItem('companyId') || '1';

    const getBranchName = (id: string) => {
        if (id === '1') return 'Timișoara (Headquarters)';
        if (id === '2') return 'Cluj-Napoca Branch';
        if (id === '3') return 'București Branch';
        return `Branch #${id}`;
    };

    const getCurrentFormattedDate = () => {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    };

    const upcomingSessions = getActiveAndUpcomingSessions();
    const SessionCardComponent = SessionCard as any;

    return (
        <div style={{ width: '100%', color: '#fff', fontFamily: 'sans-serif' }}>

            {/* 🎯 ZONĂ COMPLET IZOLATĂ DE CSS-UL EXTERN PRIN STILURI INLINE TOTALE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', marginTop: '10px' }}>
                <div>
                    <p style={{ color: '#666', fontSize: '14px', margin: 0, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        Welcome
                    </p>
                    <h1 style={{ margin: '5px 0 0 0', fontSize: '38px', fontWeight: '800', color: '#ffffff', textTransform: 'capitalize' }}>
                        {displayUserName}! 👋
                    </h1>
                </div>
                {/* Iconița rotundă de profil a fost eliminată complet de aici */}
            </div>

            {/* 📊 GRID DE CARDURI ORIZONTALE */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <div style={{ background: '#141414', border: '1px solid #222', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>GymFit Hub</span>
                    <h2 style={{ color: '#ccff00', margin: '8px 0 4px 0', fontSize: '22px', fontWeight: 'bold' }}>{role || 'Admin'} Mode</h2>
                    <span style={{ color: '#aaa', fontSize: '13px' }}>📍 {getBranchName(storedCompanyId)}</span>
                </div>

                <div style={{ background: '#141414', border: '1px solid #222', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>{getCurrentFormattedDate()}</h2>
                    <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>Today</span>
                </div>

                <div
                    onClick={() => setActiveTab && setActiveTab('sessions')}
                    style={{ background: '#ccff00', color: '#000', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                >
                    <span style={{ fontSize: '24px', marginBottom: '4px', fontWeight: 'bold' }}>+</span>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Publish New Class</h2>
                </div>
            </div>

            {/* 📅 SECȚIUNEA DE CLASE PROGRAMATE */}
            <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '18px' }}>📋</span>
                    <h3 style={{ color: '#fff', fontSize: '20px', margin: 0, fontWeight: 'bold' }}>Active Scheduled Classes</h3>
                </div>

                {upcomingSessions.length === 0 ? (
                    <div style={{ background: '#111', border: '1px dashed #222', padding: '50px 20px', borderRadius: '16px', textAlign: 'center', color: '#555', fontSize: '14px' }}>
                        No upcoming sessions scheduled for today.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {upcomingSessions.map((s: any) => (
                            <SessionCardComponent
                                key={s.id || s.Id}
                                session={s}
                                workouts={workouts}
                                rooms={rooms}
                                role={role}
                                onEnroll={handleEnrollSession}
                                getTrainerNameById={getTrainerNameById}
                                renderEnrolledClientsList={renderEnrolledClientsList}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTrainerDashboard;