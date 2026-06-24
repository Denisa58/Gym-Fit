// src/components/PublishClassesTab.tsx
/// <reference types="react" />
import React from 'react';

const PublishClassesTab = ({ sessionError, sessionForm, handleSessionInputChange, workouts, rooms, trainers, handleCreateSession }: any) => {
    return (
        <div className="admin-sessions-split-layout">
            <div className="dashboard-card admin-form-card-stretch">
                <h3>Schedule a New Class</h3>
                {sessionError && (
                    <div style={{ color: '#ff4d4d', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginTop: '10px' }}>
                        {sessionError}
                    </div>
                )}
                <form onSubmit={handleCreateSession} className="form-field-wrapper">
                    <div>
                        <label className="form-label-styling">Select Workout Type</label>
                        <select name="workoutId" className="form-input form-select-custom" value={sessionForm.workoutId} onChange={handleSessionInputChange} required>
                            <option value="">-- Choose Workout --</option>
                            {workouts.map((w: any) => <option key={w.id || w.Id} value={w.id || w.Id}>{w.name || w.Name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="form-label-styling">Select Location / Room</label>
                        <select name="roomId" className="form-input form-select-custom" value={sessionForm.roomId} onChange={handleSessionInputChange} required>
                            <option value="">-- Choose Room --</option>
                            {rooms.map((r: any) => <option key={r.id || r.Id} value={r.id || r.Id}>{r.name || r.Name} (Max Cap: {r.maxCapacity || r.MaxCapacity})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="form-label-styling">Assign Trainer</label>
                        <select name="trainerId" className="form-input form-select-custom" value={sessionForm.trainerId} onChange={handleSessionInputChange} required>
                            <option value="">-- Choose Trainer --</option>
                            {trainers.map((t: any) => <option key={t.id || t.Id} value={t.id || t.Id}>{t.firstName || t.FirstName} {t.lastName || t.LastName}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="form-label-styling">Class Start Time</label>
                        <input type="datetime-local" name="startTime" className="form-input" value={sessionForm.startTime} onChange={handleSessionInputChange} required />
                    </div>

                    <button type="submit" className="login-button form-submit-btn-spacing">Publish Session</button>
                </form>
            </div>

            <div className="dashboard-card admin-schedule-card-stretch">
                <h3>Active Schedule</h3>
            </div>
        </div>
    );
};

export default PublishClassesTab;