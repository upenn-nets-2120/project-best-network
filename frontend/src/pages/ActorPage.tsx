import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

export default function ActorPage() {
    const navigate = useNavigate();
    const { username } = useParams();
    const rootURL = config.serverRootURL;


    const [actors, setActors] = useState<{ primaryName: string; nconst: string }[]>([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [selectedNconst, setSelectedNconst] = useState('');


    useEffect(() => {
        getActors();
    }, []);

    const home = () => {
        navigate("/" + username + "/home");
    };
  
    const profile = () => {
      navigate("/" + username + "/profilePage");
    };

    const getActors = async () => {
        try {
        const response = await axios.get(`${rootURL}/${username}/getActors`, {withCredentials : true});
        
        if (response.status === 200) {
            setActors(response.data);
        } else {
            console.error('Failed to fetch actors.');
        }
        } catch (error) {
        console.error('Fetch actors error:', error);
        }
    };

    const handleSelectActor = async (name: string, nconst : string) => {
        setSelectedActor(name);
        setSelectedNconst(nconst);

    };

    const handleSubmit = async () => {
        // Call backend to set selected actor
        if(selectedNconst == '') {
            alert("Select an actor before submitting!");
            return;
        }
        try {
            console.log(selectedNconst);
            const response = await axios.post(`${rootURL}/${username}/setActor`, {
                actor: selectedNconst
              }, { withCredentials: true });
            
            console.log(response);
            console.log(response.status);
            if (response.status === 200) {
                console.log('Selected actor set successfully:', selectedNconst);
                navigate("/"+ username+"/ProfilePage");
            } else {
                console.error('Failed to set selected actor.');
            }

            const postData = {
                title: "Actor Update",
                content: `${username} is now linked to ${selectedActor}`,
                hashtags: [],
                username: username
            };

    
            // Log the JSON data being sent
            console.log('Post data:', postData);

            const postResponse = await axios.post(`${rootURL}/${username}/createPost`, postData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Post created successfully:', postResponse.data);

    
    
        } catch (error) {
        console.error('Set selected actor error:', error);
        }
    };

    return (
        <div>
        {/* Header */}
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
            Pennstagram - {username} &nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                onClick={home}>Home</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                onClick={profile}>Profile</button>&nbsp;
            </div>
        </div>
        <h1>Choose an Actor</h1>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {actors.map((actor, index) => (
                <div key={index} className="actor-card" style={{ border: '1px solid black', padding: '10px', marginBottom: '20px' }}>
                <img
                    src={`https://best-network-nets212-sp24.s3.amazonaws.com//actorImages/${actor.nconst}.jpg`}
                    alt={actor.primaryName}
                    style={{ width: '200px', height: '200px', marginBottom: '10px' }}
                />
                <p>{actor.primaryName}</p>
                <button
                    onClick={() => handleSelectActor(actor.primaryName, actor.nconst)}
                    disabled={actor.primaryName === selectedActor}
                    className={`px-4 py-2 rounded-md ${actor.primaryName === selectedActor ? 'bg-gray-500' : 'bg-indigo-500'} outline-none font-bold text-white`}
                >
                    {actor.primaryName === selectedActor ? 'Selected' : 'Select'}
                </button>
                {actor.primaryName === selectedActor && <span>Selected</span>}
                </div>
            ))}
        </div>


        <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
        >
            Submit
        </button>

        {selectedActor && <p>Selected Actor: {selectedActor}</p>}
        </div>
    );
}
