// src/components/WorkoutsTab.tsx

import React from 'react';
import { Workout } from '../models/Workout';

interface WorkoutFormState {
    name: string;
    description: string;
    difficultyLevel: string | number;
    estimatedDuration: number | string;
    averageCaloriesBurned: number | string;
}

interface WorkoutsTabProps {
    workouts: any[]; // any[] oprește orice eroare de mapare internă
    workoutForm: any;
    onInputChange: (e: any) => void;
    onSubmit: (e: any) => void;
}

// Scoatem ": React.FC<WorkoutsTabProps>" și punem tipizarea direct pe parametri
export default function WorkoutsTab({ workouts, workoutForm, onInputChange, onSubmit }: WorkoutsTabProps) {
    return (
        <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
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

            <div className="dashboard-card" style={{flex: '1.5', minWidth: '350px'}}>
                <h3>Available Workouts ({workouts?.length || 0})</h3>
                <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {workouts && workouts.map((w: any) => (
                        <div key={w.id || w.Id} style={{
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
                            <span style={{fontSize: '12px', backgroundColor: '#333', padding: '4px 8px', borderRadius: '6px'}}>{w.estimatedDuration || w.EstimatedDuration} min</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}