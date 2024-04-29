import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

export default function UserProfile() {
  const [username, setUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [email, setEmail] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [actor, setActor] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile();
    getRecommendedHashtags();
    getMostSimilarActors();
  }, []);

  const getProfile = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/getProfile`, {
        email,
      });

      if (response.status === 200) {
        const { username, photo, email, hashtags } = response.data;
        setUsername(username);
        setProfilePhoto(photo);
        setEmail(email);
        setHashtags(hashtags);
      } else {
        console.error('Failed to fetch profile data.');
      }
    } catch (error) {
      console.error('Fetch profile data error:', error);
    }
  };

  const getRecommendedHashtags = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/getRecommendedHashtags`, {
        email,
      });

      if (response.status === 200) {
        const { hashtags } = response.data;
        setHashtags(hashtags);
      } else {
        console.error('Failed to fetch recommended hashtags.');
      }
    } catch (error) {
      console.error('Fetch recommended hashtags error:', error);
    }
  };

  const getMostSimilarActors = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/getMostSimilarActors`, {
        email,
      });

      if (response.status === 200) {
        const { actor } = response.data;
        setActor(actor);
      } else {
        console.error('Failed to fetch most similar actors.');
      }
    } catch (error) {
      console.error('Fetch most similar actors error:', error);
    }
  };

  const addHashtag = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/addHashtag`, {
        hashtag: newHashtag,
      });

      if (response.status === 200) {
        // Update hashtags in state
        setHashtags([...hashtags, newHashtag]);
        setNewHashtag('');
      } else {
        setError('Failed to add hashtag.');
      }
    } catch (error) {
      console.error('Add hashtag error:', error);
      setError('Failed to add hashtag.');
    }
  };
  
  const removeHashtag = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/removeHashtag`, {
        hashtagToRemove: 'exampleHashtag', // Replace 'exampleHashtag' with the actual hashtag to remove
      });
  
      if (response.status === 200) {
        // Remove the hashtag from state
        setHashtags(hashtags.filter(tag => tag !== 'exampleHashtag')); // Update with the actual hashtag name
      } else {
        setError('Failed to remove hashtag.');
      }
    } catch (error) {
      console.error('Remove hashtag error:', error);
      setError('Failed to remove hashtag.');
    }
  };
  
  const resetActor = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/setActor`);
  
      if (response.status === 200) {
        // Reset actor successful, update state if needed
        setActor('');
      } else {
        setError('Failed to reset actor.');
      }
    } catch (error) {
      console.error('Reset actor error:', error);
      setError('Failed to reset actor.');
    }
  };
  

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    try {
      const response = await axios.post(`${config.serverRootURL}/setProfilePhoto`, {file: file });
      if (response.status === 200) {
        // Profile photo uploaded successfully
        const { photo } = response.data;
        setProfilePhoto(photo);
      } else {
        console.error('Failed to upload profile photo.');
      }
    } catch (error) {
      console.error('Upload profile photo error:', error);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div>
        <div>Username: {username}</div>
        <div>Email: {email}</div>
        <div>
          Profile Photo: {profilePhoto ? <img src={profilePhoto} alt="Profile" style={{ maxWidth: '100px' }} /> : 'No photo'}
        </div>
        <div>Hashtags: {hashtags.join(', ')}</div>
        <div>Actor: {actor}</div>
      </div>

      <form>
        <div className="flex space-x-4 items-center justify-between">
          <label htmlFor="email" className="font-semibold">Email</label>
          <input
            id="email"
            type="email"
            className="outline-none bg-white rounded-md border border-slate-100 p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {/* Input and button to add hashtag */}
        <div className="flex space-x-4 items-center">
          <input
            id="addHashtagInput"
            type="text"
            className="outline-none bg-white rounded-md border border-slate-100 p-2"
            placeholder="Enter hashtag"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
            onClick={addHashtag}
          >
            Add Hashtag
          </button>
        </div>
        {/* Button to remove hashtag */}
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
          onClick={removeHashtag}
        >
          Remove Hashtag
        </button>
        {/* Input and button to reset actor */}
        <div className="flex space-x-4 items-center">
          <input
            id="resetActorInput"
            type="text"
            className="outline-none bg-white rounded-md border border-slate-100 p-2"
            placeholder="Enter actor name"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-indigo-500 outline-none text-white"
            onClick={resetActor}
          >
            Reset Actor
          </button>
        </div>
        {/* Input for file upload */}
        <div className="flex space-x-4 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </form>
    </div>
  );
}
