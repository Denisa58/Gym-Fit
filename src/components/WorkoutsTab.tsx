// src/components/WorkoutsTab.tsx
import React from 'react';

interface WorkoutsTabProps {
    workouts: any[];
    workoutForm: any;
    onInputChange: (e: any) => void;
    onSubmit: (e: any) => void;
}

export default function WorkoutsTab({ workouts, workoutForm, onInputChange, onSubmit }: WorkoutsTabProps) {
    const role = localStorage.getItem('role') || localStorage.getItem('userRole') || 'Client';

    const handleDelete = async (id: any) => {
        if (!window.confirm("Are you sure you want to delete this workout type?")) return;
        try {
            const token = localStorage.getItem('userToken');

            // 🎯 RETAȚĂ IDENTICĂ CU MEMBERSHIPS: OData nativ cu paranteze rotunde pentru ID
            const res = await fetch(`https://localhost:7104/odata/Workouts(${id})`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("🗑️ Workout deleted!");
                window.location.reload(); // Reîmprospătare pagină
            } else {
                alert("Could not delete the workout. Make sure backend is updated.");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
            {/* Formular Creare Workout */}
            <div className="dashboard-card" style={{flex: '1', minWidth: '300px'}}>
                <h3>Create Workout Type</h3>
                <form onSubmit={onSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px'}}>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Workout Name</label>
                        <input type="text" name="name" className="form-input" value={workoutForm?.name || ''} onChange={onInputChange} required/>
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Description</label>
                        <input type="text" name="description" className="form-input" value={workoutForm?.description || ''} onChange={onInputChange} required/>
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Difficulty Level</label>
                        <select name="difficultyLevel" className="form-input" value={workoutForm?.difficultyLevel || 'Beginner'} onChange={onInputChange} style={{width: '100%', background: '#1c1c1c', color: '#fff'}}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Duration (minutes)</label>
                        <input type="number" name="estimatedDuration" className="form-input" value={workoutForm?.estimatedDuration || ''} onChange={onInputChange} required/>
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Calories Burned</label>
                        <input type="number" name="averageCaloriesBurned" className="form-input" value={workoutForm?.averageCaloriesBurned || ''} onChange={onInputChange} required/>
                    </div>
                    <button type="submit" className="login-button">Save Workout</button>
                </form>
            </div>

            {/* Listă Workouts */}
            <div className="dashboard-card" style={{flex: '1.5', minWidth: '350px'}}>
                <h3>Available Workouts ({workouts?.length || 0})</h3>
                <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {workouts && workouts.map((w: any) => {
                        const idWorkout = w.id || w.Id;
                        return (
                            <div key={idWorkout} style={{
                                padding: '14px',
                                backgroundColor: '#1c1c1c',
                                borderRadius: '10px',
                                border: '1px solid #2a2a2a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong style={{color: '#ccff00'}}>{w.name || w.Name}</strong>
                                    <div style={{fontSize: '12px', color: '#aaa', marginTop: '4px'}}>{w.description || w.Description}</div>
                                </div>

                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                    <span style={{fontSize: '12px', backgroundColor: '#333', padding: '4px 8px', borderRadius: '6px'}}>{w.estimatedDuration || w.EstimatedDuration} min</span>

                                    {role === 'Admin' && (
                                        <button
                                            onClick={() => handleDelete(idWorkout)}
                                            style={{
                                                background: '#ff3333',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}