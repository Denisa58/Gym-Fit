// src/components/PublishClassesTab.tsx
/// <reference types="react" />
import React from 'react';

const PublishClassesTab = ({ sessionError, sessionForm, handleSessionInputChange, workouts, rooms, trainers, handleCreateSession }: any) => {
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
                    letterSpacing: '-0.5px'
                }}>
                    📅 Schedule a New Class
                </h3>

                {sessionError && (
                    <div style={{
                        color: '#ff4d4d',
                        backgroundColor: 'rgba(255, 77, 77, 0.1)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '20px',
                        border: '1px solid rgba(255, 77, 77, 0.2)',
                        textAlign: 'center'
                    }}>
                        ⚠️ {sessionError}
                    </div>
                )}

                <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Field: Workout Type */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#aaa', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Select Workout Type
                        </label>
                        <select
                            name="workoutId"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#1f1f1f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }}
                            value={sessionForm.workoutId}
                            onChange={handleSessionInputChange}
                            required
                        >
                            <option value="" style={{ backgroundColor: '#141414' }}>-- Choose Workout --</option>
                            {workouts.map((w: any) => (
                                <option key={w.id || w.Id} value={w.id || w.Id} style={{ backgroundColor: '#141414' }}>
                                    {w.name || w.Name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Field: Location / Room */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#aaa', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Select Location / Room
                        </label>
                        <select
                            name="roomId"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#1f1f1f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                            value={sessionForm.roomId}
                            onChange={handleSessionInputChange}
                            required
                        >
                            <option value="" style={{ backgroundColor: '#141414' }}>-- Choose Room --</option>
                            {rooms.map((r: any) => (
                                <option key={r.id || r.Id} value={r.id || r.Id} style={{ backgroundColor: '#141414' }}>
                                    {r.name || r.Name} (Max Cap: {r.maxCapacity || r.MaxCapacity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Field: Assign Trainer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#aaa', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Assign Trainer
                        </label>
                        <select
                            name="trainerId"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#1f1f1f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                            value={sessionForm.trainerId}
                            onChange={handleSessionInputChange}
                            required
                        >
                            <option value="" style={{ backgroundColor: '#141414' }}>-- Choose Trainer --</option>
                            {trainers.map((t: any) => (
                                <option key={t.id || t.Id} value={t.id || t.Id} style={{ backgroundColor: '#141414' }}>
                                    {t.firstName || t.FirstName} {t.lastName || t.LastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Field: Class Start Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#aaa', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Class Start Time
                        </label>
                        <input
                            type="datetime-local"
                            name="startTime"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#1f1f1f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                outline: 'none',
                                colorScheme: 'dark' // Face picker-ul nativ de dată să fie pe temă întunecată
                            }}
                            value={sessionForm.startTime}
                            onChange={handleSessionInputChange}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
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
                            transition: 'transform 0.1s ease, background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b2df00'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ccff00'}
                    >
                        Publish Session
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublishClassesTab;