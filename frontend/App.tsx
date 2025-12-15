import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import Loading from './components/Loading';
import Classroom from './components/Classroom';

// Wrapper to handle global layout styles if needed
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="antialiased">{children}</div>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/class" element={<Classroom />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;