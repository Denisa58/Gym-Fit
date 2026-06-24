// src/components/SessionCard.tsx
import React from 'react';

// Definim structura props pentru a asigura compatibilitatea deplină, folosind 'any' pentru modele, 
// permițând codului tău nativ să verifice proprietățile indiferent dacă vin cu PascalCase sau camelCase.
interface SessionCardProps {
    session: any;
    workouts: any[];
    rooms: any[];
    role: string;
    onEnroll: (id: any) => void;
    getTrainerNameById: (session: any) => string;
}

// 🎯 MAPARE PENTRU ENUM-UL DIN C# (Difficulty)
const difficultyLabels: { [key: number]: string } = {
    0: 'Beginner',
    1: 'Intermediate',
    2: 'Advanced',
    3: 'Pro'
};

const SessionCard = ({
                         session,
                         workouts,
                         rooms,
                         role,
                         onEnroll,
                         getTrainerNameById
                     }: SessionCardProps) => {

// 1. Găsim tipul de antrenament (Workout) asociat acestei sesiuni
    const sWorkoutId = session.workoutId || session.WorkoutId;
    const currentWorkout = workouts.find(w => w.id === sWorkoutId || w.Id === sWorkoutId);

// 2. Găsim camera/locația asociată
    const sRoomId = session.roomId || session.RoomId;
    const currentRoom = rooms.find(r => r.id === sRoomId || r.Id === sRoomId);

// 3. Calculăm durata dinamic
    let duration = currentWorkout?.estimatedDuration || currentWorkout?.EstimatedDuration;

// Fallback: Dacă nu e găsită în workout, o calculăm din diferența dintre EndTime și StartTime
    if (!duration && (session.startTime || session.StartTime) && (session.endTime || session.EndTime)) {
        const start: any = new Date(session.startTime || session.StartTime);
        const end: any = new Date(session.endTime || session.EndTime);
        if (!isNaN(start) && !isNaN(end)) {
            duration = Math.round((end - start) / 60000); // Milisecunde în minute
        }
    }
    const finalDuration = duration || 50; // Backup final dacă ambele metode eșuează

// 4. Formatare dată și oră pentru afișare
    const formatSessionTime = (startTimeRaw: any) => {
        if (!startTimeRaw) return 'N/A';
        let raw = startTimeRaw;
        if (typeof raw === 'string' && !raw.endsWith('Z') && !raw.includes('+')) {
            raw += 'Z';
        }
        const d = new Date(raw);
        if (isNaN(d.getTime())) return 'Invalid Date';

        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', ' at');
    };

// 5. Verificare număr clienți înscriși și capacitate maximă
    const enrolledClientsList = session.enrolledClients || session.EnrolledClients || [];
    const currentEnrolled = Array.isArray(enrolledClientsList) ? enrolledClientsList.length : 0;
    const maxCap = session.maxCapacity || session.MaxCapacity || currentRoom?.maxCapacity || currentRoom?.MaxCapacity || 10;

    // 🎯 Verificăm dacă utilizatorul curent logat este deja înscris în această sesiune
    const currentUserId = localStorage.getItem("userId");
    const isUserEnrolled = enrolledClientsList.some((c: any) =>
        String(c.id || c.Id) === String(currentUserId)
    );

// 🔄 MODIFICAT INTERN: Adăugat afișarea email-ului pentru admini/traineri
    const internalRenderEnrolledClients = (list: any[]) => {
        if (!list || list.length === 0) {
            return <p style={{color: '#666', fontSize: '13px', margin: '5px 0 0 0', fontStyle: 'italic'}}>No clients enrolled yet.</p>;
        }
        return (
            <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px'}}>
                <strong style={{color: '#aaa', fontSize: '13px'}}>Enrolled Clients ({list.length}):</strong>
                <ul style={{
                    margin: 0,
                    paddingLeft: '15px',
                    color: '#fff',
                    fontSize: '13px',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}>
                    {list.map((c, idx) => (
                        <li key={c.id || c.Id || idx} style={{marginBottom: '5px'}}>
                            {c.firstName || c.FirstName || ''} {c.lastName || c.LastName || `Client #${c.id || c.Id}`}
                            {/* 🎯 Pasul 1 Frontend: Afișăm emailul în paranteză, cu un stil discret */}
                            <span style={{ color: '#888', fontSize: '11px', marginLeft: '6px' }}>
                                ({c.email || c.Email || 'no email'})
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // 🎯 Logica dinamică pentru textul și starea butonului de înscriere
    const getButtonTextAndState = () => {
        if (isUserEnrolled) {
            return { text: 'Session Booked', disabled: true, bg: '#222', color: '#00ea98' };
        }
        if (currentEnrolled >= maxCap) {
            return { text: 'Full Class', disabled: true, bg: '#333', color: '#666' };
        }
        return { text: 'Book Class', disabled: false, bg: '#ccff00', color: '#000' };
    };

    const btnState = getButtonTextAndState();

    // 🎯 EXTRAGEM CUMPUL DE DIFICULTATE (Asigurăm suport complet indiferent de Casing)
    const rawDifficulty = currentWorkout?.difficultyLevel !== undefined
        ? currentWorkout?.difficultyLevel
        : currentWorkout?.DifficultyLevel;

    // Convertim cifra din C# în text folosind obiectul de mapare, sau punem un fallback sigur
    const displayDifficulty = rawDifficulty !== undefined && difficultyLabels[rawDifficulty] !== undefined
        ? difficultyLabels[rawDifficulty]
        : 'All Levels';

    return (
        <div className="dashboard-card" style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
            <div>
                {/* Header-ul cardului: Nume și Durata Dinamică */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                }}>
                    <h3 style={{color: '#ccff00', margin: 0, fontSize: '20px', fontWeight: 'bold'}}>
                        {currentWorkout?.name || currentWorkout?.Name || `Workout #${sWorkoutId}`}
                    </h3>
                    <span style={{
                        fontSize: '12px',
                        backgroundColor: '#222',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#aaa',
                        fontWeight: '500'
                    }}>
                        {finalDuration} min
                    </span>
                </div>

                {/* Descriere scurtă */}
                <p style={{color: '#888', fontSize: '14px', marginTop: '4px', marginBottom: '20px'}}>
                    {currentWorkout?.description || currentWorkout?.Description || 'No description available.'}
                </p>

                {/* Detalii Sesiune (Locație, Dată, Trainer, Dificultate) */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#ddd'}}>
                    <div>
                        📍 <strong>Room:</strong> {currentRoom?.name || currentRoom?.Name || `Room #${sRoomId}`}
                    </div>
                    <div>
                        🕒 <strong>Time:</strong> {formatSessionTime(session.startTime || session.StartTime)}
                    </div>
                    <div>
                        👤 <strong>Trainer:</strong> <span style={{color: '#ccff00'}}>{getTrainerNameById(session)}</span>
                    </div>
                    <div>
                        {/* 🎯 RANDARE REZOLVATĂ ÎN CUVINTE ACUM */}
                        💪 <strong>Level:</strong> {displayDifficulty}
                    </div>
                </div>

                {/* Listă clienți înscriși vizibilă doar pentru Admin sau Trainer */}
                {(role === 'Admin' || role === 'Trainer') && (
                    <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #1f1f1f'}}>
                        {internalRenderEnrolledClients(enrolledClientsList)}
                    </div>
                )}
            </div>

            {/* Footer-ul cardului: Locuri disponibile și Butonul de Rezervare */}
            <div style={{
                marginTop: '25px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #1f1f1f',
                paddingTop: '15px'
            }}>
                <span style={{fontSize: '13px', color: '#aaa'}}>
                    Booked: <strong style={{color: currentEnrolled >= maxCap ? '#ff3333' : '#fff'}}>{currentEnrolled}</strong> / {maxCap} spots
                </span>

                {role === 'Client' && (
                    <button
                        onClick={() => onEnroll(session.id || session.Id)}
                        disabled={btnState.disabled}
                        className="login-button"
                        style={{
                            margin: 0,
                            padding: '8px 16px',
                            fontSize: '14px',
                            background: btnState.bg,
                            color: btnState.color,
                            cursor: btnState.disabled ? 'not-allowed' : 'pointer',
                            border: isUserEnrolled ? '1px solid #00ea98' : 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        {btnState.text}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SessionCard;