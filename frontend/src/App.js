import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

import Home            from './components/Home';
import Recommendations from './components/Recommendations';
import ChatBot         from './components/ChatBot';
import CareerTips      from './components/CareerTips';

import './style.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>AI Job Recommendation System</h1>
          <p>Empowering your job search with intelligent recommendations and mentorship.</p>
          <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/recommendations">Recommendations</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/career-tips">Career Tips</Link>
          </nav>
        </header>

        <main className="app-main">
          <Switch>
            <Route path="/"              exact component={Home} />
            <Route path="/recommendations" component={Recommendations} />
            <Route path="/chat"            component={ChatBot} />
            <Route path="/career-tips"     component={CareerTips} />
          </Switch>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} AI Job Recommendation System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
