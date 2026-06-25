// src/components/MembershipsTab.tsx
/// <reference types="react" />
import React from 'react';

const MembershipsTab = () => {
    const [memberships, setMemberships] = React.useState([]);
    const [form, setForm] = React.useState({
        name: '', price: '', durationMonths: 1, description: '',
        hasPoolAccess: false, hasSaunaAccess: false, hasTrainerIncluded: false, maxWorkoutsPerWeek: 3
    });

    React.useEffect(() => {
        loadMemberships();
    }, []);

    const loadMemberships = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await fetch("https://localhost:7104/odata/Memberships", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMemberships(data.value || data.$values || data || []);
            }
        } catch (err) {
            console.error("Eroare la încărcarea abonamentelor:", err);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleCreate = async (e: any) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('userToken');

            // 🎯 REPARAT: Mapăm câmpurile în format PascalCase pentru a se potrivi exact cu modelul OData din C#
            const payload = {
                Id: 0, // Adăugat explicit pentru convenția OData
                Name: form.name,
                Price: parseFloat(form.price),
                DurationMonths: parseInt(form.durationMonths as any, 10),
                Description: form.description,
                HasPoolAccess: form.hasPoolAccess,
                HasSaunaAccess: form.hasSaunaAccess,
                HasTrainerIncluded: form.hasTrainerIncluded,
                MaxWorkoutsPerWeek: parseInt(form.maxWorkoutsPerWeek as any, 10)
            };

            const res = await fetch("https://localhost:7104/odata/Memberships", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("🎉 Membership created successfully!");
                setForm({
                    name: '',
                    price: '',
                    durationMonths: 1,
                    description: '',
                    hasPoolAccess: false,
                    hasSaunaAccess: false,
                    hasTrainerIncluded: false,
                    maxWorkoutsPerWeek: 3
                });
                loadMemberships();
            } else {
                // Încercăm să prindem eroarea exactă de la server pentru a o vedea în alert dacă mai e cazul
                const errText = await res.text();
                alert(`Error creating membership: ${errText || res.statusText}`);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };
    const handleDelete = async (id: any) => {
        if (!window.confirm("Are you sure you want to delete this membership plan?")) return;
        try {
            const token = localStorage.getItem('userToken');

            // 🎯 MODIFICAT: Sintaxă OData cu paranteze rotunde pentru ID: odata/Memberships(id)
            const res = await fetch(`https://localhost:7104/odata/Memberships(${id})`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                alert("🗑️ Membership deleted!");
                loadMemberships();
            } else {
                alert("Could not delete the membership.");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const labelStyle = {
        fontSize: '13px',
        color: '#aaa',
        marginBottom: '5px',
        display: 'block',
        fontWeight: '500' as const
    };

    return (
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {/* Formularul de Adăugare Abonament */}
            <div className="dashboard-card" style={{ flex: '1', minWidth: '320px' }}>
                <h3>Create New Membership Plan</h3>
                <form onSubmit={handleCreate}
                      style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

                    <div>
                        <label style={labelStyle}>Membership Name</label>
                        <input type="text" name="name" placeholder="e.g. Premium Pass" className="form-input"
                               value={form.name} onChange={handleInputChange} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Price (EUR)</label>
                        <input type="number" name="price" placeholder="e.g. 40" className="form-input"
                               value={form.price} onChange={handleInputChange} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Duration (Months)</label>
                        <input type="number" name="durationMonths" placeholder="e.g. 1" className="form-input"
                               value={form.durationMonths} onChange={handleInputChange} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea name="description" placeholder="Write a short description about this plan..."
                                  className="form-input" value={form.description} onChange={handleInputChange} style={{
                            width: '100%',
                            background: '#1c1c1c',
                            color: '#fff',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            padding: '10px',
                            height: '80px',
                            resize: 'none'
                        }} />
                    </div>

                    <div>
                        <label style={labelStyle}>Max Workouts Allowed per Week</label>
                        <input type="number" name="maxWorkoutsPerWeek" placeholder="e.g. 3" className="form-input"
                               value={form.maxWorkoutsPerWeek} onChange={handleInputChange} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '5px 0' }}>
                        <label
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#aaa', fontWeight: '500' }}>
                            <input type="checkbox" name="hasPoolAccess" checked={form.hasPoolAccess}
                                   onChange={handleInputChange} /> Pool Access
                        </label>

                        <label
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#aaa', fontWeight: '500' }}>
                            <input type="checkbox" name="hasSaunaAccess" checked={form.hasSaunaAccess}
                                   onChange={handleInputChange} /> Sauna Access
                        </label>

                        <label
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#aaa', fontWeight: '500' }}>
                            <input type="checkbox" name="hasTrainerIncluded" checked={form.hasTrainerIncluded}
                                   onChange={handleInputChange} /> Personal Trainer Included
                        </label>
                    </div>

                    <button type="submit" className="login-button" style={{ marginTop: '5px' }}>Save Membership</button>
                </form>
            </div>

            {/* Lista de Abonamente existente */}
            <div className="dashboard-card" style={{ flex: '1.5', minWidth: '350px' }}>
                <h3>Existing Memberships ({memberships.length})</h3>
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {memberships.length === 0 ? <p style={{ color: '#666' }}>No memberships in database yet.</p> :
                        memberships.map((m: any) => (
                            <div key={m.id || m.Id} style={{
                                padding: '14px',
                                backgroundColor: '#1c1c1c',
                                borderRadius: '10px',
                                border: '1px solid #2a2a2a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong style={{ color: '#ccff00', fontSize: '16px' }}>{m.name || m.Name}</strong>
                                    <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                                        💰 {m.price || m.Price} € | 🕒 {m.durationMonths || m.DurationMonths} {m.durationMonths === 1 ? 'Month' : 'Months'}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(m.id || m.Id)} style={{
                                    background: '#ff3333',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>Delete
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default MembershipsTab;