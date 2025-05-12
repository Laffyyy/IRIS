import './App.css';
import { useState } from 'react';
import Login from './Login';
import Otp from './Otp';
import ChangePassword from './ChangePassword';

function App() {
  const [currentView, setCurrentView] = useState('login');

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login 
          onContinue={() => setCurrentView('otp')} 
          onForgotPassword={() => setCurrentView('changePassword')} 
        />;
        case 'otp':
          return <Otp 
            onBack={() => setCurrentView('login')} 
            onChangePassword={() => setCurrentView('changePassword')}
          />;
      case 'changePassword':
        return <ChangePassword onCancel={() => setCurrentView('login')} />;
      default:
        return <Login 
          onContinue={() => setCurrentView('otp')} 
          onForgotPassword={() => setCurrentView('changePassword')} 
        />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;