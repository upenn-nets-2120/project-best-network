import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';

export default function Signup() {
    const navigate = useNavigate(); 

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
    const [topHashtags, setTopHashtags] = useState<string[]>([]); // State variable for top hashtags


    useEffect(() => {
        console.log("usereffect");
        fetchTopHashtags();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
    
        try {
            // call backend
            const response = await axios.post(`${rootURL}/register`, {
                username,
                password,
                firstName,
                lastName,
                email,
                birthday,
                affiliation,
                hashtagInterests
            }, { withCredentials: true });
    
            if (response.status === 200) {
                // Redirect to profile photo setup if registration is successful
                const loginResponse = await axios.post(`${config.serverRootURL}/login`, {
                    username,
                    password
                }, { withCredentials: true });
    
                if (loginResponse.status === 200) {
                    navigate(`/${username}/setProfilePhoto`);
                }
            } else {
                alert('Registration failed.');
            }
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null) {
                const typedError = error as { response?: { data?: { error?: string } } };
                if (typedError.response?.data?.error) {
                    alert(`Registration failed: ${typedError.response.data.error}`);
                } else {
                    alert('Registration failed: An unknown error occurred.');
                }
            } else {
                alert('Registration failed: An unknown error occurred.');
            }
            console.error('Registration error:', error);
        }
    };    

    const fetchTopHashtags = async () => {
        try {
            console.log('fetching hashtags');

            const response = await axios.get(`${rootURL}/tophashtags`);
            if (response.status === 200) {
                const topHashtagsData = response.data.topHashtags;
                setTopHashtags(topHashtagsData);
            } else {
                console.error('Failed to fetch top hashtags.');
            }
        } catch (error) {
            console.error('Fetch top hashtags error:', error);
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <div className="w-full max-w-lg flex flex-col items-center"> {/* Container */}

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

            {/* Display top hashtags */}
            {topHashtags.length > 0 && (
                <div>
                    <h2>Trending Hashtags</h2>
                    <ul>
                        {topHashtags.map((hashtag, index) => (
                            <li key={index}>{hashtag}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        </div>
    );
}
