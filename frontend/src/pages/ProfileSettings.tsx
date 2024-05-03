import { useState } from 'react';
import axios from 'axios'; 
import config from '../../config.json';
import { useParams } from 'react-router-dom';


export default function ProfileSettings() {
    const rootURL = config.serverRootURL;

    const { username } = useParams();


    const [user, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangeUsername = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-username`, {
                username: user
            }, { withCredentials: true });
            alert('Username updated successfully.');
        } catch (error) {
            console.error('Username update error:', error);
            alert('Failed to update username.');
        }
    };

    const handleChangeFirstName = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-firstname`, {
                firstName: firstName
            }, { withCredentials: true });
            alert('First name updated successfully.');
        } catch (error) {
            console.error('First name update error:', error);
            alert('Failed to update first name.');
        }
    };

    const handleChangeLastName = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-lastname`, {
                lastName: lastName
            }, { withCredentials: true });
            alert('Last name updated successfully.');
        } catch (error) {
            console.error('Last name update error:', error);
            alert('Failed to update last name.');
        }
    };

    const handleChangeEmail = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-email`, {
                email: email
            }, { withCredentials: true });
            alert('Email updated successfully.');
        } catch (error) {
            console.error('Email update error:', error);
            alert('Failed to update email.');
        }
    };

    const handleChangeBirthday = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-birthday`, {
                birthday: birthday
            }, { withCredentials: true });
            alert('Birthday updated successfully.');
        } catch (error) {
            console.error('Birthday update error:', error);
            alert('Failed to update birthday.');
        }
    };

    const handleChangeAffiliation = async () => {
        try {
            await axios.put(`${rootURL}/${username}/change-affiliation`, {
                affiliation: affiliation
            }, { withCredentials: true });
            alert('Affiliation updated successfully.');
        } catch (error) {
            console.error('Affiliation update error:', error);
            alert('Failed to update affiliation.');
        }
    };


    const handleChangePassword = async () => {
        try {
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }
            await axios.put(`${rootURL}/${username}/change-password`, {
                password: password
            }, { withCredentials: true });
            alert('Password updated successfully.');
        } catch (error) {
            console.error('Password update error:', error);
            alert('Failed to update password.');
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
                <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                    Profile Settings
                </div>
                <div className='flex space-x-4 items-center justify-between'>
                    <label htmlFor="username" className='font-semibold'>Username</label>
                    <input
                        id="user"
                        type="text"
                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                        value={user}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={handleChangeUsername} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Username
                    </button>
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
                    <button onClick={handleChangeFirstName} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change First Name
                    </button>
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
                    <button onClick={handleChangeLastName} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Last Name
                    </button>
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
                    <button onClick={handleChangeEmail} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Email
                    </button>
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
                    <button onClick={handleChangeBirthday} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Birthday
                    </button>
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
                    <button onClick={handleChangeAffiliation} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Affiliation
                    </button>
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
                    <button onClick={handleChangePassword} className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'>
                        Change Password
                    </button>
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
            </div>
        </div>
    );
}
