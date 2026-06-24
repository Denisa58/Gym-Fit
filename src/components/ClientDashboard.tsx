// src/components/ClientDashboard.tsx
/// <reference types="react" />
import React from 'react';
import SessionCard from './SessionCard';

const ClientDashboard = ({
                             userName = 'User',
                             membershipActivatedAt,
                             daysLeft,
                             membershipName,
                             currentTime,
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

    const currentUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('userIdCurent') || '1';

    const savedPic = localStorage.getItem(`profilePic_${currentUserId}`);
    const activeProfileImageUrl = savedPic
        ? (savedPic.startsWith('data:') ? savedPic : `https://localhost:7104${savedPic}`)
        : null;

    const SessionCardAny = SessionCard as any;

    return (
        <div>
            <div className="client-welcome-row">
                <div>
                    <p className="welcome-label">Welcome</p>
                    <h1 className="welcome-heading">{userName}! 👋</h1>
                </div>
                <div onClick={() => history.push('/profile')} className="dashboard-profile-avatar" style={{ cursor: 'pointer' }}>
                    {activeProfileImageUrl ? (
                        <img src={activeProfileImageUrl} alt="Dashboard Profile" className="navbar-avatar-image"/>
                    ) : (
                        <span className="navbar-avatar-fallback">{(userName || 'U').charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>

            {membershipActivatedAt && daysLeft <= 7 && (
                <div className="warning-banner">
                    <span className="warning-icon">⚠️</span>
                    <div>
                        <div className="warning-title">Your membership is expiring soon</div>
                        <div className="warning-subtitle">Keep training!</div>
                    </div>
                </div>
            )}

            <h3 className="section-title">Quick Actions</h3>

            <div className="quick-actions-grid">
                <div className="membership-status-card">
                    <span className="membership-card-brand">GymFit</span>
                    <h3 className="membership-card-title" style={{color: membershipActivatedAt ? '#ccff00' : '#888'}}>
                        {membershipActivatedAt ? membershipName : 'NO MEMBERSHIP'}
                    </h3>
                    <p className="membership-card-desc">
                        {membershipActivatedAt ? `${daysLeft} days left` : "No active membership"}
                    </p>
                </div>

                <div className="date-status-card">
                    <h3 className="date-card-highlight">
                        {currentTime.toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
                    </h3>
                    <p className="date-card-label">Today</p>
                </div>

                <div onClick={() => setActiveTab('memberships')} className="buy-membership-action-card" style={{ cursor: 'pointer' }}>
                    <div className="buy-card-plus">+</div>
                    <h4 className="buy-card-text">Buy Membership</h4>
                </div>
            </div>

            <h3 className="section-title-margin-top">📅 Available Classes</h3>
            <div className="available-classes-grid">
                {getActiveAndUpcomingSessions().length === 0 ? (
                    <p className="no-classes-text">No upcoming sessions available at the moment.</p>
                ) : (
                    getActiveAndUpcomingSessions().map((s: any) => (
                        <SessionCardAny
                            key={s.id || s.Id}
                            session={s}
                            workouts={workouts}
                            rooms={rooms}
                            role={role}
                            onEnroll={handleEnrollSession}
                            getTrainerNameById={getTrainerNameById}
                            renderEnrolledClientsList={renderEnrolledClientsList}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;