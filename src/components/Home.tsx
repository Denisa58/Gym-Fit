// src/components/Home.tsx
/// <reference types="react" />
import React from 'react';
import { useHistory } from 'react-router-dom';
import { authService } from '../services/authService';
import { gymService } from '../services/gymService';

// Importăm componentele modulare rămase
import SessionCard from './SessionCard';
import RoomsTab from './RoomsTab';
import WorkoutsTab from './WorkoutsTab';
import AddTrainerAdminTab from './AddTrainerAdminTab';
import MembershipCards from './MembershipCards';
import MembershipsTab from './MembershipsTab';
import ClientDashboard from './ClientDashboard';
import AdminTrainerDashboard from './AdminTrainerDashboard';
import PublishClassesTab from './PublishClassesTab';
import './Home.css';

const Home = () => {
    const history = useHistory();

    // 🎯 Preluare Rol și ID din Storage
    const role = localStorage.getItem('role') || localStorage.getItem('userRole') || 'Client';
    const userId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('userIdCurent') || '1';

    // 🎯 Extragere inițială Nume Utilizator din Token
    const [userName, setUserName] = React.useState(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const decoded = JSON.parse(window.atob(base64));
                    const jwtName =
                        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] ||
                        decoded.unique_name ||
                        decoded.name ||
                        decoded.UserName;

                    if (jwtName && jwtName !== 'undefined' && jwtName !== 'null') return jwtName;
                }
            } catch (e) {
                console.error("Eroare la decodarea token-ului:", e);
            }
        }
        return localStorage.getItem('userName') || (role === 'Admin' ? 'Administrator' : 'User');
    });

    const storedCompanyId = localStorage.getItem('companyId') || '1';
    const companyIdInt = parseInt(storedCompanyId, 10);

    const [activeTab, setActiveTab] = React.useState(() => {
        if (history.location.state && (history.location.state as any).targetTab) {
            return (history.location.state as any).targetTab;
        }
        return 'dashboard';
    });

    // 🎯 Pornim direct cu starea că nu există abonament activ pentru a evita blocarea butonului de Buy
    const [membershipName, setMembershipName] = React.useState('No Active Membership');

    const [rooms, setRooms] = React.useState([]);
    const [workouts, setWorkouts] = React.useState([]);
    const [sessions, setSessions] = React.useState([]);
    const [trainers, setTrainers] = React.useState([]);
    const [currentTime, setCurrentTime] = React.useState(new Date());

    const [roomForm, setRoomForm] = React.useState({ name: '', maxCapacity: 10, equipmentType: '', isAvailable: true });
    const [sessionForm, setSessionForm] = React.useState({ workoutId: '', roomId: '', trainerId: '', startTime: '' });
    const [sessionError, setSessionError] = React.useState('');

    const [workoutForm, setWorkoutForm] = React.useState({
        name: '', description: '', difficultyLevel: 'Beginner', estimatedDuration: 50, averageCaloriesBurned: 400
    });

    const [membershipActivatedAt, setMembershipActivatedAt] = React.useState(() => {
        const savedDate = localStorage.getItem(`membershipActivatedAt_${userId}`);
        return savedDate ? new Date(savedDate) : null;
    });

    const savedProfilePic = localStorage.getItem(`profilePic_${userId}`);
    const profileImageUrl = savedProfilePic
        ? (savedProfilePic.startsWith('data:') ? savedProfilePic : `https://localhost:7104${savedProfilePic}`)
        : null;

    const getDaysLeft = () => {
        if (!membershipActivatedAt) return 0;
        const expiryDate = new Date(membershipActivatedAt);
        expiryDate.setDate(expiryDate.getDate() + 30);
        const diffTime = expiryDate.getTime() - currentTime.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    React.useEffect(() => {
        if (history.location.state && (history.location.state as any).targetTab) {
            history.replace({ pathname: '/home', state: {} });
        }
    }, [history]);

    React.useEffect(() => {
        loadInitialData();
    }, [activeTab]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadInitialData = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const headersConfig = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            };

            // 1. Încărcare Săli
            const rResponse = await fetch(`https://localhost:7104/odata/Rooms?companyId=${storedCompanyId}`, { headers: headersConfig });
            if (rResponse.ok) {
                const rData = await rResponse.json();
                const rawRooms = rData.value || rData || [];
                setRooms(rawRooms.map((r: any) => ({
                    ...r,
                    id: r.Id ?? r.id,
                    name: r.Name ?? r.name,
                    maxCapacity: r.MaxCapacity ?? r.maxCapacity,
                    equipmentType: r.EquipmentType ?? r.equipmentType,
                    isAvailable: r.IsAvailable ?? r.isAvailable
                })));
            }

            // 2. Încărcare Tipuri de Antrenament (Workouts) + Aliniere IQueryable OData
            const wResponse = await fetch(`https://localhost:7104/api/Workouts?companyId=${storedCompanyId}`, { headers: headersConfig });
            if (wResponse.ok) {
                const wData = await wResponse.json();
                const rawWorkouts = wData.value || wData || [];
                setWorkouts(rawWorkouts.map((w: any) => ({
                    ...w,
                    id: w.id ?? w.Id,
                    name: w.name ?? w.Name,
                    description: w.description ?? w.Description,
                    difficultyLevel: w.difficultyLevel ?? w.DifficultyLevel,
                    estimatedDuration: w.estimatedDuration ?? w.EstimatedDuration,
                    averageCaloriesBurned: w.averageCaloriesBurned ?? w.AverageCaloriesBurned
                })));
            }

            // 3. Încărcare Sesiuni brute prin OData
            const sResponse = await fetch(`https://localhost:7104/odata/Sessions?companyId=${storedCompanyId}&$expand=EnrolledClients`, { headers: headersConfig });
            if (sResponse.ok) {
                const sData = await sResponse.json();
                setSessions(sData.value || sData || []);
            }

            // 4. Preluare date Client prin OData
            if (role === 'Client' && userId && userId !== 'undefined' && userId !== 'null') {
                try {
                    let userResponse = null;
                    let userData = null;

                    userResponse = await fetch(`https://localhost:7104/odata/Clients(${userId})`, { method: 'GET', headers: headersConfig });

                    if (userResponse.ok) {
                        const result = await userResponse.json();
                        userData = result.value ? (Array.isArray(result.value) ? result.value[0] : result.value) : result;
                    }

                    if (userData) {
                        const dbFirstName = userData.firstName || userData.FirstName;
                        const dbLastName = userData.lastName || userData.LastName;
                        if (dbFirstName) {
                            const fullDbName = `${dbFirstName} ${dbLastName || ''}`.trim();
                            localStorage.setItem('userName', fullDbName);
                            setUserName(fullDbName);
                        }

                        const rawMembershipId = userData.membershipId || userData.MembershipId;

                        if (!rawMembershipId || rawMembershipId === 0) {
                            setMembershipName("No Active Membership");
                            localStorage.removeItem(`membershipId_${userId}`);
                            setMembershipActivatedAt(null);
                        } else {
                            try {
                                const mResponse = await fetch(`https://localhost:7104/odata/Memberships(${rawMembershipId})`, { headers: headersConfig });
                                if (mResponse.ok) {
                                    const mData = await mResponse.json();
                                    setMembershipName(mData.name || mData.Name || "No Active Membership");
                                } else {
                                    processMembershipFallback(rawMembershipId);
                                }
                            } catch (errMembership) {
                                processMembershipFallback(rawMembershipId);
                            }

                            const dbActivatedAt = userData.membershipActivatedAt || userData.MembershipActivatedAt;
                            if (dbActivatedAt) {
                                localStorage.setItem(`membershipActivatedAt_${userId}`, dbActivatedAt);
                                setMembershipActivatedAt(new Date(dbActivatedAt));
                            }
                        }
                    } else {
                        executeFinalFallback();
                    }
                } catch (errUser) {
                    console.error("Eroare la procesarea profilului prin OData API:", errUser);
                    executeFinalFallback();
                }
            }

            if (role === 'Admin' && userId) {
                setUserName('Administrator');
            }

            // 5. Încărcare Antrenori + Normalizare structură OData
            try {
                const tResponse = await fetch(`https://localhost:7104/api/Trainers?companyId=${storedCompanyId}`, {
                    method: 'GET',
                    headers: headersConfig
                });
                if (tResponse.ok) {
                    const tData = await tResponse.json();
                    const rawTrainers = tData.value || tData || [];

                    setTrainers(rawTrainers.map((t: any) => ({
                        ...t,
                        id: t.id ?? t.Id,
                        firstName: t.firstName ?? t.FirstName,
                        lastName: t.lastName ?? t.LastName,
                        email: t.email ?? t.Email,
                        phoneNumber: t.phoneNumber ?? t.PhoneNumber,
                        specialization: t.specialization ?? t.Specialization,
                        yearsOfExperience: t.yearsOfExperience ?? t.YearsOfExperience ?? t.experienceYears ?? t.ExperienceYears ?? 0,
                        companyId: t.companyId ?? t.CompanyId
                    })));
                }
            } catch (e) {
                console.error("Error loading trainers:", e);
            }
        } catch (err) {
            console.error("Error loading data from API:", err);
        }
    };

    const processMembershipFallback = (rawId: any) => {
        if (rawId) {
            const mId = parseInt(rawId, 10);
            if (mId === 1) setMembershipName("Standard Plan");
            else if (mId === 2) setMembershipName("Premium Plan");
            else if (mId === 3) setMembershipName("Gold VIP Pass");
            else if (mId === 4) setMembershipName("Platinum Plan");
            else setMembershipName("No Active Membership");
        } else {
            executeFinalFallback();
        }
    };

    const executeFinalFallback = () => {
        const savedMembershipId = localStorage.getItem(`membershipId_${userId}`) || localStorage.getItem('membershipId');
        if (savedMembershipId) {
            processMembershipFallback(savedMembershipId);
            return;
        }
        setMembershipName("No Active Membership");
    };

    const handleRoomInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setRoomForm({ ...roomForm, [name]: type === 'checkbox' ? checked : value });
    };

    const handleWorkoutInputChange = (e: any) => {
        setWorkoutForm({ ...workoutForm, [e.target.name]: e.target.value });
    };

    const handleSessionInputChange = (e: any) => {
        setSessionForm({ ...sessionForm, [e.target.name]: e.target.value });
    };

    const handleCreateRoom = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                Name: roomForm.name,
                MaxCapacity: parseInt(roomForm.maxCapacity as any, 10),
                EquipmentType: roomForm.equipmentType,
                IsAvailable: roomForm.isAvailable,
                CompanyId: companyIdInt
            };

            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const response = await fetch('https://localhost:7104/odata/Rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(await response.text() || "Failed to create room");
            alert("Room added successfully!");
            setRoomForm({ name: '', maxCapacity: 10, equipmentType: '', isAvailable: true });
            loadInitialData();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const handleCreateWorkout = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...workoutForm,
                estimatedDuration: parseInt(workoutForm.estimatedDuration as any, 10),
                averageCaloriesBurned: parseInt(workoutForm.averageCaloriesBurned as any, 10),
                companyId: companyIdInt
            };

            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const response = await fetch('https://localhost:7104/api/Workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(await response.text() || "Failed to create workout");
            alert("Workout type created successfully!");
            setWorkoutForm({
                name: '', description: '', difficultyLevel: 'Beginner', estimatedDuration: 50, averageCaloriesBurned: 400
            });
            loadInitialData();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const handleCreateSession = async (e: any) => {
        e.preventDefault();
        setSessionError('');

        const selectedRoom: any = rooms.find((r: any) => r.id === parseInt(sessionForm.roomId, 10));
        const selectedWorkout: any = workouts.find((w: any) => w.id === parseInt(sessionForm.workoutId, 10));

        if (!selectedRoom || !selectedWorkout) {
            setSessionError("Please select a valid room and workout.");
            return;
        }

        const durationMinutes = selectedWorkout.estimatedDuration || 50;
        const startDate = new Date(sessionForm.startTime);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        const finalCapacity = parseInt(selectedRoom.maxCapacity, 10);

        const combinedPayload = {
            session: {
                workoutId: parseInt(sessionForm.workoutId, 10),
                roomId: parseInt(sessionForm.roomId, 10),
                trainerId: parseInt(sessionForm.trainerId, 10) || parseInt(userId, 10) || 1,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                maxCapacity: finalCapacity,
                companyId: companyIdInt
            },
            room: {
                id: selectedRoom.id,
                name: selectedRoom.name || "Selected Room",
                maxCapacity: finalCapacity,
                equipmentType: selectedRoom.equipmentType || "General Equipment",
                isAvailable: selectedRoom.isAvailable !== undefined ? selectedRoom.isAvailable : true,
                companyId: companyIdInt
            }
        };

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const response = await fetch('https://localhost:7104/api/Sessions/validate-and-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(combinedPayload)
            });

            if (response.ok) {
                alert("🎉 Session created successfully!");
                setSessionForm({ workoutId: '', roomId: '', trainerId: '', startTime: '' });
                loadInitialData();
            } else {
                const errorText = await response.text();
                setSessionError(`Server error: ${errorText}`);
            }
        } catch (err) {
            setSessionError("Could not connect to the server.");
        }
    };

    const handleEnrollSession = async (sessionId: any) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            const cleanPayload = { sessionId: parseInt(sessionId, 10), userId: parseInt(userId, 10) };

            const response = await fetch(`https://localhost:7104/api/Sessions/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(cleanPayload)
            });

            if (response.ok) {
                alert("🎯 You have successfully booked this class!");
                setTimeout(async () => { await loadInitialData(); }, 300);
            } else {
                alert(`Booking failed: ${await response.text()}`);
            }
        } catch (err) {
            alert("Error connecting to the server.");
        }
    };

    const handleLogout = () => {
        authService.logout();
        history.push('/login');
    };

    const getTrainerNameById = (s: any) => {
        const tId = s.trainerId || s.TrainerId;
        if (!tId) return "Unassigned Trainer";
        const foundTrainer: any = trainers.find((t: any) => t.id === tId || t.Id === tId);
        if (foundTrainer) return `${foundTrainer.firstName || foundTrainer.FirstName} ${foundTrainer.lastName || foundTrainer.LastName}`;
        return `Trainer #${tId}`;
    };

    const renderEnrolledClientsList = (enrolledList: any) => {
        if (!enrolledList || enrolledList.length === 0) return null;
        return (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#1c1c1c', borderRadius: '6px' }}>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {enrolledList.map((client: any) => (
                        <li key={client.id || client.Id} style={{ fontSize: '12px', color: '#ddd' }}>
                            {client.firstName || client.FirstName} {client.lastName || client.LastName}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const getActiveAndUpcomingSessions = () => {
        if (!sessions || sessions.length === 0) return [];

        return [...sessions]
            .filter((s: any) => {
                let startTimeRaw = s.StartTime ?? s.startTime;
                if (!startTimeRaw) return false;

                let sessionDate = new Date(startTimeRaw);

                if (typeof startTimeRaw === 'string' && !startTimeRaw.endsWith('Z') && !startTimeRaw.includes('+')) {
                    sessionDate = new Date(startTimeRaw + 'Z');
                }

                if (isNaN(sessionDate.getTime())) return false;

                const currentWorkoutId = s.WorkoutId ?? s.workoutId;
                const matchedWorkout = workouts.find((w: any) => (w.id ?? w.Id) === currentWorkoutId);
                const durationMinutes = matchedWorkout?.estimatedDuration ?? matchedWorkout?.EstimatedDuration ?? 50;

                const sessionEndDate = new Date(sessionDate.getTime() + durationMinutes * 60000);

                return sessionEndDate >= currentTime;
            })
            .sort((a: any, b: any) => {
                const timeA = new Date(a.StartTime || a.startTime).getTime() || 0;
                const timeB = new Date(b.StartTime || b.startTime).getTime() || 0;
                return timeA - timeB;
            })
            .map((s: any) => {
                const currentWorkoutId = s.WorkoutId ?? s.workoutId;
                const matchedWorkout = workouts.find((w: any) => String(w.id ?? w.Id) === String(currentWorkoutId));

                const normalizedWorkout = matchedWorkout ? {
                    ...matchedWorkout,
                    id: matchedWorkout.id ?? matchedWorkout.Id,
                    name: matchedWorkout.name ?? matchedWorkout.Name,
                    description: matchedWorkout.description ?? matchedWorkout.Description,
                    estimatedDuration: matchedWorkout.estimatedDuration ?? matchedWorkout.EstimatedDuration
                } : null;

                const actualEnrolledClients = s.EnrolledClients ?? s.enrolledClients ?? [];

                return {
                    ...s,
                    id: s.Id ?? s.id,
                    startTime: s.StartTime ?? s.startTime,
                    endTime: s.EndTime ?? s.endTime,
                    workoutId: currentWorkoutId,
                    roomId: s.RoomId ?? s.roomId,
                    trainerId: s.TrainerId ?? s.trainerId,
                    companyId: s.CompanyId ?? s.companyId,
                    maxCapacity: s.MaxCapacity ?? s.maxCapacity,
                    enrolledClients: actualEnrolledClients,
                    EnrolledClients: actualEnrolledClients,
                    workout: normalizedWorkout,
                    Workout: normalizedWorkout
                };
            });
    };

    const getTopNavBtnStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        return {
            padding: '8px 16px',
            background: 'transparent',
            color: isActive ? '#ccff00' : '#aaa',
            border: 'none',
            borderBottom: isActive ? '3px solid #ccff00' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold' as const,
        };
    };

    const daysLeft = getDaysLeft();

    return (
        <div className="home-page-wrapper">
            <nav className="top-navbar">
                <div className="navbar-brand"><span className="brand-text">GymFit</span></div>
                <div className="navbar-navigation">
                    <button onClick={() => setActiveTab('dashboard')} style={getTopNavBtnStyle('dashboard')}>Home</button>
                    {role === 'Client' && <button onClick={() => setActiveTab('memberships')} style={getTopNavBtnStyle('memberships')}>Memberships</button>}
                    <button onClick={() => history.push('/profile')} style={getTopNavBtnStyle('profile')}>Profile</button>

                    {/* 🔓 ACCES ADMIN */}
                    {role === 'Admin' && (
                        <>
                            <button onClick={() => setActiveTab('rooms')} style={getTopNavBtnStyle('rooms')}>Rooms</button>
                            <button onClick={() => setActiveTab('add-trainer')} style={getTopNavBtnStyle('add-trainer')}>New Trainer</button>
                            <button onClick={() => setActiveTab('manage-memberships')} style={getTopNavBtnStyle('manage-memberships')}>Manage Memberships</button>
                        </>
                    )}

                    {/* 🔓 ACCES MIXT: ADMIN & TRAINER (Corectat: redă butoanele de Workout și Clase) */}
                    {(role === 'Admin' || role === 'Trainer') && (
                        <>
                            <button onClick={() => setActiveTab('workouts')} style={getTopNavBtnStyle('workouts')}>New Workout</button>
                            <button onClick={() => setActiveTab('sessions')} style={getTopNavBtnStyle('sessions')}>Schedule Class</button>
                        </>
                    )}
                </div>
                <div className="navbar-user-actions">
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </nav>

            <div className="main-content-layout">
                {activeTab === 'dashboard' && (
                    role === 'Client' ? (
                        <ClientDashboard
                            userName={userName} profileImageUrl={profileImageUrl} membershipActivatedAt={membershipActivatedAt}
                            daysLeft={daysLeft} membershipName={membershipName} currentTime={currentTime}
                            getActiveAndUpcomingSessions={getActiveAndUpcomingSessions} workouts={workouts} rooms={rooms}
                            role={role} handleEnrollSession={handleEnrollSession} getTrainerNameById={getTrainerNameById}
                            renderEnrolledClientsList={renderEnrolledClientsList} setActiveTab={setActiveTab} history={history}
                        />
                    ) : (
                        <AdminTrainerDashboard
                            userName={userName} setActiveTab={setActiveTab} history={history}
                            getActiveAndUpcomingSessions={getActiveAndUpcomingSessions} workouts={workouts} rooms={rooms}
                            role={role} handleEnrollSession={handleEnrollSession} getTrainerNameById={getTrainerNameById}
                            renderEnrolledClientsList={renderEnrolledClientsList}
                        />
                    )
                )}

                {activeTab === 'memberships' && <MembershipCards membershipName={membershipName} />}
                {role === 'Admin' && activeTab === 'manage-memberships' && <MembershipsTab />}
                {role === 'Admin' && activeTab === 'rooms' && <RoomsTab rooms={rooms} roomForm={roomForm} onInputChange={handleRoomInputChange} onSubmit={handleCreateRoom} />}
                {role === 'Admin' && activeTab === 'add-trainer' && <AddTrainerAdminTab />}
                {(role === 'Admin' || role === 'Trainer') && activeTab === 'workouts' && <WorkoutsTab workouts={workouts} workoutForm={workoutForm} onInputChange={handleWorkoutInputChange} onSubmit={handleCreateWorkout} />}
                {(role === 'Admin' || role === 'Trainer') && activeTab === 'sessions' && (
                    <PublishClassesTab
                        sessionError={sessionError} sessionForm={sessionForm} handleSessionInputChange={handleSessionInputChange}
                        workouts={workouts} rooms={rooms} trainers={trainers} handleCreateSession={handleCreateSession}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;