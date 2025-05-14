import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Otp from './Otp';
import ChangePassword from './ChangePassword';
import SecurityQuestions from './SecurityQuestions';  // Import SecurityQuestions
import UpdatePassword from './UpdatePassword';  // Import UpdatePassword

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/security-questions" element={<SecurityQuestions />} />
          <Route path="/update-password" element={<UpdatePassword />} />  {/* Add this line for UpdatePassword */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
