import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';

export default function Signup() {
    const navigate = useNavigate(); 
    
    // TODO: set appropriate state variables 

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

    const rootURL = config.serverRootURL;

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [hashtagInterests, setHashtagInterests] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();  

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        try {
            var response = await axios.post(`${rootURL}/register`, {
                username: username,
                password: password,
                firstName: firstName, 
                lastName: lastName, 
                email: email, 
                birthday: birthday, 
                affiliation: affiliation, 
                hashtagInterests: hashtagInterests
            }, { withCredentials: true });

            if (response.status === 200) {
                var response = await axios.post(`${config.serverRootURL}/login`, {
                    username,
                    password
                },{ withCredentials: true });
          
                if (response.status === 200) {
                    // response.render('homepage.ejs', {data: null, comments: null, message: 'Getting friends unsuccessful.', user: user});
                navigate ("/" + username +"/setProfilePhoto")
                //   navigate("/"+ username+"/home");
                }
                
            } else {
                alert('Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed.');
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Sign Up to Pennstagram
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="username" className='font-semibold'>Username</label>
                        <input
                            id="username"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="password" className='font-semibold'>Password</label>
                        <input
                            id="password"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="confirmPassword" className='font-semibold'>Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="firstName" className='font-semibold'>First Name</label>
                        <input
                            id="firstName"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="lastName" className='font-semibold'>Last Name</label>
                        <input
                            id="lastName"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="email" className='font-semibold'>Email</label>
                        <input
                            id="email"
                            type="email"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="birthday" className='font-semibold'>Birthday</label>
                        <input
                            id="birthday"
                            type="date"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="affiliation" className='font-semibold'>Affiliation</label>
                        <input
                            id="affiliation"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="hashtagInterests" className='font-semibold'>Hashtag Interests</label>
                        <input
                            id="hashtagInterests"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={hashtagInterests}
                            onChange={(e) => setHashtagInterests(e.target.value.split(',').map(item => item.trim()))}
                        />
                    </div>
                    <div className='w-full flex justify-center'>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
