import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
// 1. 🔥 IMPORTĂM NOUA COMPONENTĂ DE RESETARE PAROLĂ
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import './App.css';

function App() {
    return (
        <Router>
            <Switch>
                {/* Te trimite la Login direct când deschizi site-ul */}
                <Route exact path="/">
                    <Redirect to="/login" />
                </Route>

                {/* Pagina de Login */}
                <Route path="/login" component={Login} />

                {/* Pagina de Register */}
                <Route path="/register" component={Register} />

                {/* Pagina Principală (care conține și interfața de Admin/Trainer/Client) */}
                <Route path="/home" component={Home} />

                {/* 2. 🔥 ADĂUGĂM RUTA PENTRU RESETAREA PAROLEI */}
                {/* Când utilizatorul vine din email, React îl va trimite la acest formular */}
                <Route path="/reset-password" component={ResetPassword} />

                {/* Pagina de Profile - Mutată corect aici pentru a deveni accesibilă */}
                <Route path="/profile" component={Profile} />

                {/* Rută de siguranță: Rămâne întotdeauna ULTIMA linie în interiorul Switch */}
                <Route path="*">
                    <Redirect to="/login" />
                </Route>
            </Switch>
        </Router>
    );
}

export default App;