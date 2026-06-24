// src/components/RoomsTab.tsx
import React from 'react';

interface RoomsTabProps {
    rooms: any[];
    roomForm: any;
    onInputChange: (e: any) => void;
    onSubmit: (e: any) => void;
}

const RoomsTab = ({ rooms, roomForm, onInputChange, onSubmit }: RoomsTabProps) => {

    return (
        <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
            <div className="dashboard-card" style={{flex: '1', minWidth: '300px'}}>
                <h3>Add New Gym Room</h3>
                <form onSubmit={onSubmit}
                      style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px'}}>
                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Room Name</label>
                        <input type="text" name="name" className="form-input" value={roomForm.name}
                               onChange={onInputChange} placeholder="ex: Aerobic Studio A" required/>
                    </div>

                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Max Capacity</label>
                        <input type="number" name="maxCapacity" className="form-input" value={roomForm.maxCapacity}
                               onChange={onInputChange} required/>
                    </div>

                    <div>
                        <label style={{fontSize: '12px', color: '#888'}}>Equipment Type</label>
                        <input type="text" name="equipmentType" className="form-input" value={roomForm.equipmentType}
                               onChange={onInputChange} placeholder="ex: Steps, Yoga Mats" required/>
                    </div>

                    <button type="submit" className="login-button">Save Room</button>
                </form>
            </div>

            <div className="dashboard-card" style={{flex: '1.5', minWidth: '350px'}}>
                <h3>Existing Rooms ({rooms.length})</h3>
                <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {rooms.map(room => (
                        <div key={room.id || room.Id} style={{
                            padding: '14px',
                            backgroundColor: '#1c1c1c',
                            borderRadius: '10px',
                            border: '1px solid #2a2a2a',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <strong>{room.name || room.Name}</strong>
                                <br/>
                                <span style={{
                                    fontSize: '12px',
                                    color: '#666'
                                }}>{room.equipmentType || room.EquipmentType}</span>
                            </div>

                            <span style={{
                                color: '#ccff00',
                                fontWeight: 'bold'
                            }}>Cap: {room.maxCapacity || room.MaxCapacity}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoomsTab;