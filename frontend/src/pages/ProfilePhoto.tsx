import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function SetProfilePhoto() {
    const navigate = useNavigate();
    const rootURL = config.serverRootURL;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        setSelectedFile(file);
    };

    // Handle form submission
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedFile) {
            alert('Please select a file.');
            return;
        }

        // Create a FormData object and append the file
        const formData = new FormData();
        formData.append('profilePhoto', selectedFile);

        // Perform the file upload request
        try {
            const response = await axios.post(`${rootURL}/setProfilePhoto`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Handle the response
            if (response.status === 200) {
                // Photo upload successful, navigate to the user's profile page
                navigate(`/home`); // Change this URL if you want to navigate elsewhere
            } else {
                alert('Photo upload failed.');
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            alert('Photo upload failed.');
        }
    };

    // JSX for the profile photo upload form
    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Upload Profile Photo
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="profilePhoto" className='font-semibold'>Select a Photo</label>
                        <input
                            id="profilePhoto"
                            type="file"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className='w-full flex justify-center'>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                        >
                            Upload Photo
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
