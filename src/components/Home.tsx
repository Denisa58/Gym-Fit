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

    // 🎯 REPARAT: Pornim direct cu starea că nu există abonament activ pentru a evita blocarea butonului de Buy
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

            // 1. Încărcare Săli, Antrenamente și Sesiuni standard
            const rResponse = await fetch(`https://localhost:7104/api/Room?companyId=${storedCompanyId}`, { headers: headersConfig });
            if (rResponse.ok) setRooms(await rResponse.json());

            const wResponse = await fetch(`https://localhost:7104/api/Workouts?companyId=${storedCompanyId}`, { headers: headersConfig });
            if (wResponse.ok) setWorkouts(await wResponse.json());

            const sResponse = await fetch(`https://localhost:7104/api/Sessions?companyId=${storedCompanyId}`, { headers: headersConfig });
            if (sResponse.ok) setSessions(await sResponse.json());

            // 🎯 REPARARE FETCH CLIENT FOLOSIND RUTA CORECTĂ ODATA CONFIGURATĂ PE SERVER (/odata/)
            if (role === 'Client' && userId && userId !== 'undefined' && userId !== 'null') {
                try {
                    let userResponse = null;
                    let userData = null;

                    userResponse = await fetch(`https://localhost:7104/odata/Clients(${userId})`, { method: 'GET', headers: headersConfig });

                    if (userResponse.ok) {
                        const result = await userResponse.json();
                        userData = result.value ? (Array.isArray(result.value) ? result.value[0] : result.value) : result;
                    }

                    // Dacă am reușit să extragem utilizatorul din baza de date
                    if (userData) {
                        const dbFirstName = userData.firstName || userData.FirstName;
                        const dbLastName = userData.lastName || userData.LastName;
                        if (dbFirstName) {
                            const fullDbName = `${dbFirstName} ${dbLastName || ''}`.trim();
                            localStorage.setItem('userName', fullDbName);
                            setUserName(fullDbName);
                        }

                        // Extragere și mapare dinamică MembershipId din baza de date
                        const rawMembershipId = userData.membershipId || userData.MembershipId;

                        // 🎯 REPARAT: Dacă în baza de date nu este selectat niciun abonament (null sau 0)
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

                            // Extragere dată activare abonament doar dacă există un plan selectat
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

            try {
                const tResponse = await fetch(`https://localhost:7104/api/Trainers?companyId=${storedCompanyId}`, {
                    method: 'GET',
                    headers: headersConfig
                });
                if (tResponse.ok) {
                    const tData = await tResponse.json();
                    if (tData && tData.value) setTrainers(tData.value);
                    else if (Array.isArray(tData)) setTrainers(tData);
                }
            } catch (e) {
                console.error("Error loading trainers:", e);
            }
        } catch (err) {
            console.error("Error loading data from API:", err);
        }
    };

    // Helper pentru maparea ID-urilor scalare în caz că nu avem denumirea în DB
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

    // SAFENET FALLBACK
    const executeFinalFallback = () => {
        const savedMembershipId = localStorage.getItem(`membershipId_${userId}`) || localStorage.getItem('membershipId');
        if (savedMembershipId) {
            processMembershipFallback(savedMembershipId);
            return;
        }

        // Dacă nu există informații clare în storage și nici din DB, înseamnă că nu are plan activ
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
            const response = await fetch('https://localhost:7104/api/Room', {
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

        const selectedRoom: any = rooms.find((r: any) => r.id === parseInt(sessionForm.roomId, 10) || r.Id === parseInt(sessionForm.roomId, 10));
        const selectedWorkout: any = workouts.find((w: any) => w.id === parseInt(sessionForm.workoutId, 10) || w.Id === parseInt(sessionForm.workoutId, 10));

        if (!selectedRoom || !selectedWorkout) {
            setSessionError("Please select a valid room and workout.");
            return;
        }

        const durationMinutes = selectedWorkout.estimatedDuration || selectedWorkout.EstimatedDuration || 50;
        const startDate = new Date(sessionForm.startTime);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        const finalCapacity = parseInt(selectedRoom.maxCapacity || selectedRoom.MaxCapacity, 10);

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
                id: selectedRoom.id || selectedRoom.Id,
                name: selectedRoom.name || selectedRoom.Name || "Selected Room",
                maxCapacity: finalCapacity,
                equipmentType: selectedRoom.equipmentType || selectedRoom.EquipmentType || "General Equipment",
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
        return sessions
            .filter((s: any) => {
                let startTimeRaw = s.startTime || s.StartTime;
                if (startTimeRaw && typeof startTimeRaw === 'string' && !startTimeRaw.endsWith('Z')) startTimeRaw += 'Z';
                return new Date(startTimeRaw) >= currentTime;
            })
            .sort((a: any, b: any) => new Date(a.startTime || a.StartTime).getTime() - new Date(b.startTime || b.StartTime).getTime());
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
                    {role === 'Admin' && (
                        <>
                            <button onClick={() => setActiveTab('rooms')} style={getTopNavBtnStyle('rooms')}>Rooms</button>
                            <button onClick={() => setActiveTab('add-trainer')} style={getTopNavBtnStyle('add-trainer')}>New Trainer</button>
                            <button onClick={() => setActiveTab('manage-memberships')} style={getTopNavBtnStyle('manage-memberships')}>Manage Memberships</button>
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

                {/* Transmitem mai departe membershipName către componentă pentru validarea butoanelor */}
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