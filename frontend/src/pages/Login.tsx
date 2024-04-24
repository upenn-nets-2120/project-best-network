import { useState } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate(); 

  // TODO: set appropriate state variables for username and password 

  const rootURL = config.serverRootURL;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // POST /register 
/*  Example body: 
    {
      "username": "vavali",
      "password": "1234",
      "firstName": "Vedha",
      "lastName": "Avali",
      "email": "vedha.avali@gmail.com",
      "birthday": "2004-08-08",
      "affiliation": "Penn",
      "hashtagInterests": ["hello", "bye"] -> this should be in list format, can be null
    }

*/

  const handleLogin = async () => {
    // TODO: check username and password using /login route 
    axios.post(`${config.serverRootURL}/login`, {
      username,
      password
  }, { withCredentials: true })
  .then(response => {
      if (response.status === 200) {
          navigate(`/${username}/home`);
      } else {
          alert('Log in failed.');
      }
  })
  .catch(error => {
      console.error('Login error:', error);
      alert('Log in failed.');
  });
  };

  const signup = () => {
    navigate("/signup");
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form>
        <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
          <div className='font-bold flex w-full justify-center text-2xl mb-4'>
            Log In
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="username" className='font-semibold'>Username</label>
            <input id="username" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="password" className='font-semibold'>Password</label>
            <input id="password" type="password" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='w-full flex justify-center'>
            <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
              onClick={handleLogin}>Log in</button>
          </div>
          <div className='w-full flex justify-center'>
            <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none text-white'
              onClick={signup}>Sign up</button>
          </div>
        </div>
      </form>
    </div>
  )
}
