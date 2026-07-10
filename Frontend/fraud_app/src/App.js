import './App.css';
import Navbar from './Navbar';
import UploadComponent from './upload';

function App() {
  const title = "Fraud App"

  return (
    <div className="App">
      <nav />
      <div className='content'>
        <h1>{title}</h1>
        <UploadComponent />
      </div>
      
    </div>
  );
}

export default App;
  