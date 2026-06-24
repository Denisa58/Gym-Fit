// src/components/PublishSessionsTab.tsx
/// <reference types="react" />
import React from 'react';

const PublishSessionsTab = ({ workouts, rooms, trainers, userId, onSessionCreated }: any) => {

    // Folosim structura stabilă React.useState pentru a evita erorile din IDE
    const [sessionForm, setSessionForm] = React.useState({
        workoutId: '',
        roomId: '',
        trainerId: '',
        date: '',
        startTime: '',
        availableSlots: ''
    });
    const [sessionError, setSessionError] = React.useState('');

    const handleSessionInputChange = (e: any) => {
        const { name, value } = e.target;
        setSessionForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSession = async (e: any) => {
        e.preventDefault();
        setSessionError('');

        // Validări de bază în frontend
        if (!sessionForm.workoutId || !sessionForm.roomId || !sessionForm.trainerId || !sessionForm.date || !sessionForm.startTime || !sessionForm.availableSlots) {
            setSessionError('Toate câmpurile sunt obligatorii!');
            return;
        }

        // Combinăm data și ora într-un format ISO acceptat de .NET (ex: 2026-06-21T16:00:00)
        const combinedStartDateTime = `${sessionForm.date}T${sessionForm.startTime}:00`;

        const payload = {
            workoutId: parseInt(sessionForm.workoutId),
            roomId: parseInt(sessionForm.roomId),
            trainerId: parseInt(sessionForm.trainerId),
            startTime: combinedStartDateTime,
            availableSlots: parseInt(sessionForm.availableSlots)
        };

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const response = await fetch('https://localhost:7104/api/Sessions/validate-and-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('🎯 Clasa a fost programată și validată cu succes!');
                // Resetăm formularul
                setSessionForm({ workoutId: '', roomId: '', trainerId: '', date: '', startTime: '', availableSlots: '' });

                // Anunțăm părintele (Home.tsx) la final să reîncarce lista de clase
                if (onSessionCreated) onSessionCreated();
            } else {
                const errText = await response.text();
                setSessionError(errText || 'Eroare la validarea sau crearea sesiunii.');
            }
        } catch (err) {
            console.error(err);
            setSessionError('Eroare de rețea la conectarea cu serverul.');
        }
    };

    return (
        <div style={{
            backgroundColor: '#141414',
            padding: '25px',
            borderRadius: '15px',
            border: '1px solid #222',
            marginTop: '20px'
        }}>
            <h3 style={{ color: '#ccff00', marginTop: 0 }}>📅 Publish / Schedule New Class</h3>

            {sessionError && (
                <div style={{
                    background: 'rgba(255, 51, 51, 0.1)',
                    color: '#ff3333',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: '1px solid #ff3333',
                    fontSize: '14px'
                }}>
                    ⚠️ {sessionError}
                </div>
            )}

            <form onSubmit={handleCreateSession} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Select Workout</label>
                    <select name="workoutId" value={sessionForm.workoutId} onChange={handleSessionInputChange} style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff'
                    }}>
                        <option value="">-- Alege Antrenament --</option>
                        {workouts.map((w: any) => <option key={w.id} value={w.id}>{w.name || w.Name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Select Room</label>
                    <select name="roomId" value={sessionForm.roomId} onChange={handleSessionInputChange} style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff'
                    }}>
                        <option value="">-- Alege Sala --</option>
                        {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.Name} (Capacitate: {r.capacity})</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Select Trainer</label>
                    <select name="trainerId" value={sessionForm.trainerId} onChange={handleSessionInputChange} style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff'
                    }}>
                        <option value="">-- Alege Antrenor --</option>
                        {trainers.map((t: any) => <option key={t.id} value={t.id}>{t.firstName || t.FirstName} {t.lastName || t.LastName}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Available Slots</label>
                    <input type="number" name="availableSlots" min="1" value={sessionForm.availableSlots}
                           onChange={handleSessionInputChange} placeholder="Ex: 20" style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff',
                        boxSizing: 'border-box'
                    }}/>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Date</label>
                    <input type="date" name="date" value={sessionForm.date} onChange={handleSessionInputChange} style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff',
                        boxSizing: 'border-box'
                    }}/>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>Start Time</label>
                    <input type="time" name="startTime" value={sessionForm.startTime}
                           onChange={handleSessionInputChange} style={{
                        width: '100%',
                        padding: '10px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#fff',
                        boxSizing: 'border-box'
                    }}/>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                    <button type="submit" style={{
                        width: '100%',
                        background: '#ccff00',
                        color: '#000',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}>
                        🚀 Publish & Validate Session
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PublishSessionsTab;