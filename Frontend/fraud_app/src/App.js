import './App.css';
import Navbar from './Navbar.js';
import UploadComponent from './upload.js';

function App() {

  return (
    <div className="App">
      <Navbar />
      <div className='content'>
        <UploadComponent />
      </div>
      
    </div>
  );
}

export default App;
  