// src/components/MembershipCards.tsx
/// <reference types="react" />
import React from 'react';
import { authService } from '../services/authService';

// 🎯 Definim interfața pentru proprietăți
interface MembershipCardsProps {
    membershipName?: string;
}

// 🎯 Modificat: Folosim o funcție standard curată pentru a evita eroarea de namespace React
const MembershipCards = ({ membershipName }: MembershipCardsProps) => {
    const [memberships, setMemberships] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const userId = localStorage.getItem('userId') || localStorage.getItem('id') || '1';

    // 🎯 Verificăm corect dacă utilizatorul are un abonament real activ
    const hasActiveMembership =
        !!membershipName &&
        membershipName !== "No Active Membership" &&
        membershipName !== "Loading Pass...";

    React.useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const data = await authService.getMemberships();
                const finalData = data?.value || data?.$values || data || [];
                setMemberships(finalData);
            } catch (err: any) {
                setError(err.message || 'A apărut o eroare la încărcarea abonamentelor.');
            } finally {
                setLoading(false);
            }
        };

        fetchMemberships();
    }, []);

    const handleSelectPlan = async (plan: any) => {
        const planId = plan.id || plan.Id;
        const planName = plan.name || plan.Name || "Gym Plan";
        const token = localStorage.getItem('userToken') || localStorage.getItem('token');

        if (hasActiveMembership) {
            alert("⚠️ You already have an active membership! You cannot purchase another one until it expires.");
            return;
        }



        try {
            const response = await fetch(`https://localhost:7104/api/Memberships/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    userId: parseInt(userId, 10),
                    membershipId: parseInt(planId, 10),
                    membershipActivatedAt: new Date().toISOString()
                })
            });

            if (response.ok) {
               // alert(`🎉 Successfully purchased ${planName}! It is now active in your profile.`);

                localStorage.setItem(`membershipActivatedAt_${userId}`, new Date().toISOString());
                localStorage.setItem(`membershipName_${userId}`, planName);

                window.location.reload();
            } else {
                const errMsg = await response.text();
                alert(`Failed to purchase membership: ${errMsg}`);
            }
        } catch (err) {
            console.error(err);
            alert("Connection error. Could not reach the server.");
        }
    };

    if (loading) return <div style={{ color: '#ccff00', textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold' }}>⚡ Loading Gym Memberships...</div>;
    if (error) return <div style={{ color: '#ff4d4d', textAlign: 'center', padding: '50px' }}>⚠️ {error}</div>;

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                    color: '#fff',
                    fontSize: '32px',
                    margin: '0 0 10px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Choose Your <span style={{ color: '#ccff00' }}>Membership</span>
                </h2>
                <p style={{ color: '#888', fontSize: '16px' }}>Unlock your potential with our flexible plans tailored for your goals.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                justifyContent: 'center'
            }}>
                {memberships.map((plan: any) => (
                    <div key={plan.id || plan.Id} style={{
                        background: '#111',
                        border: hasActiveMembership ? '1px solid #333' : '1px solid #222',
                        borderRadius: '16px',
                        padding: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'transform 0.3s, border-color 0.3s',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        opacity: hasActiveMembership ? 0.7 : 1
                    }}
                         onMouseEnter={(e) => {
                             if (!hasActiveMembership) {
                                 e.currentTarget.style.transform = 'translateY(-5px)';
                                 e.currentTarget.style.borderColor = '#ccff00';
                             }
                         }}
                         onMouseLeave={(e) => {
                             if (!hasActiveMembership) {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = '#222';
                             }
                         }}
                    >
                        <div>
                            <h3 style={{
                                color: '#fff',
                                fontSize: '24px',
                                margin: '0 0 10px 0',
                                textTransform: 'capitalize'
                            }}>
                                {plan.name || plan.Name}
                            </h3>

                            <p style={{
                                color: '#666',
                                fontSize: '14px',
                                minHeight: '40px',
                                margin: '0 0 20px 0',
                                lineHeight: '1.4'
                            }}>
                                {plan.description || plan.Description || 'No description provided.'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '25px' }}>
                                <span style={{
                                    color: '#ccff00',
                                    fontSize: '36px',
                                    fontWeight: 'bold'
                                }}>{plan.price || plan.Price}</span>
                                <span style={{
                                    color: '#fff',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    marginLeft: '2px'
                                }}>€</span>
                                <span style={{ color: '#555', fontSize: '14px', marginLeft: '5px' }}>
                                    / {plan.durationMonths || plan.DurationMonths} {(plan.durationMonths || plan.DurationMonths) === 1 ? 'Month' : 'Months'}
                                </span>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #222', marginBottom: '25px' }}/>

                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: '0 0 30px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <li style={featureStyle(plan.hasPoolAccess || plan.HasPoolAccess)}>
                                    <span style={{ marginRight: '10px' }}>{(plan.hasPoolAccess || plan.HasPoolAccess) ? '✔️' : '❌'}</span> Pool Access
                                </li>
                                <li style={featureStyle(plan.hasSaunaAccess || plan.HasSaunaAccess)}>
                                    <span style={{ marginRight: '10px' }}>{(plan.hasSaunaAccess || plan.HasSaunaAccess) ? '✔️' : '❌'}</span> Sauna Access
                                </li>
                                <li style={featureStyle(plan.hasTrainerIncluded || plan.HasTrainerIncluded)}>
                                    <span style={{ marginRight: '10px' }}>{(plan.hasTrainerIncluded || plan.HasTrainerIncluded) ? '✔️' : '❌'}</span> Personal Trainer Included
                                </li>
                                <li style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '10px' }}>💪</span> Max Workouts: <strong style={{ color: '#ccff00', marginLeft: '5px' }}>{plan.maxWorkoutsPerWeek || plan.MaxWorkoutsPerWeek}</strong> / week
                                </li>
                            </ul>
                        </div>

                        <button
                            disabled={hasActiveMembership}
                            onClick={() => handleSelectPlan(plan)}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                color: hasActiveMembership ? '#555' : '#ccff00',
                                border: hasActiveMembership ? '2px solid #333' : '2px solid #ccff00',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: 'bold',
                                cursor: hasActiveMembership ? 'not-allowed' : 'pointer',
                                transition: '0.3s'
                            }}
                            onMouseEnter={(e) => {
                                if (!hasActiveMembership) {
                                    e.currentTarget.style.background = '#ccff00';
                                    e.currentTarget.style.color = '#000';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!hasActiveMembership) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#ccff00';
                                }
                            }}
                        >
                            {hasActiveMembership ? 'Already Enrolled' : 'Select Plan'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const featureStyle = (isAvailable: boolean) => ({
    color: isAvailable ? '#fff' : '#444',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    textDecoration: isAvailable ? 'none' : 'line-through'
});

export default MembershipCards;