import logo from './logo.svg';
import './App.css';

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
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
