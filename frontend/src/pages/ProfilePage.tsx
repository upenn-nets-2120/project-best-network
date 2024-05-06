import {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


export default function UserProfile() {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [email, setEmail] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [recommendedHashtags, setRecommendedHashtags] = useState<string[]>([]);
  const [similarActors, setSimilarActors] = useState<string[]>([]);
  const [actor, setActor] = useState('');
  const [newActor, setNewActor] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const rootURL = config.serverRootURL;
  

  useEffect(() => {
    getProfile();
    getRecommendedHashtags();
    getMostSimilarActors();
  }, []);

  const { username } = useParams();

  const navigate = useNavigate(); 
  const home = () => {
      navigate("/" + username + "/home");
  };

  const settings = () => {
    navigate("/" + username + "/profileSettings");
  };


  const getProfile = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/getProfile`, { withCredentials: true });


      if (response.status === 200) {
        console.log(response.data)
        //const { profilePhoto, email, hashtags, actor } = response.data; -> I changed this bc i think this led to some errors related to
        //  email being used as a variable from the response and being used a state variable etc
        setProfilePhoto(response.data.profilePhoto);
        setEmail(response.data.email);
        setHashtags(response.data.hashtags);
        setActor(response.data.actor);
        setNewActor(response.data.actor);
        console.log(response.data.hashtags)
      } else {
        console.error('Failed to fetch profile data.');
      }
    } catch (error) {
      console.error('Fetch profile data error:', error);
    }
  };

  const getRecommendedHashtags = async () => {
    try {
      const response = await axios.get(`${config.serverRootURL}/${username}/getRecommendedHashtags`);

      if (response.status === 200) {
        const { hashtags } = response.data;
        setRecommendedHashtags(hashtags);
      } else {
        console.error('Failed to fetch recommended hashtags.');
      }
    } catch (error) {
      console.error('Fetch recommended hashtags error:', error);
    }
  };

  const getMostSimilarActors = async () => {
    try {
      const response = await axios.get(`${config.serverRootURL}/${username}/getMostSimilarActors`);

      if (response.status === 200) {
        const { actors } = response.data;
        setSimilarActors(actors);
      } else {
        console.error('Failed to fetch most similar actors.');
      }
    } catch (error) {
      console.error('Fetch most similar actors error:', error);
    }
  };

  const addHashtag = async () => {
    try {
      const response = await axios.post(`${rootURL}/${username}/addHashtag`, {
        hashtag: newHashtag
      }, { withCredentials: true });

      if (response.status === 200) {
        // Update hashtags in state
        setHashtags([...hashtags, newHashtag]);
        setNewHashtag('');
      } else {
        setError('Failed to add hashtag.');
        alert("oops");
      }
    } catch (error) { 
        console.error('Add hashtag error:', error);
        setError('Failed to add hashtag.');
    }
  };

  const removeHashtag = async () => {
    try {
      const response = await axios.post(`${rootURL}/${username}/removeHashtag`, {
        hashtag: newHashtag
      }, { withCredentials: true });
  
      if (response.status === 200) {
        // Remove the hashtag from state
        setHashtags(hashtags.filter(tag => tag !== newHashtag)); // Update with the actual hashtag name
      } else {
        setError('Failed to remove hashtag.');
      }
    } catch (error) {
      console.error('Remove hashtag error:', error);
      setError('Failed to remove hashtag.');
    }
  };
  
  const resetActor = async (actorName:string) => {
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/setActor`, { actor: actorName });
  
      if (response.status === 200) {
        setActor(actorName);
        setNewActor(actorName)
      } else {
        setError('Failed to reset actor.');
      }
    } catch (error) {
      console.error('Reset actor error:', error);
      setError('Failed to reset actor.');
    }
  };
  
  const handleHashtagButtonClick = (hashtag:string) => {
    setNewHashtag(hashtag);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file.');
      return;
   }

    if (selectedFile) {
      const formData = new FormData();
      formData.append('profilePhoto', selectedFile);

    
      try {
        const response = await axios.post(`${rootURL}/:username/setProfilePhoto`, formData, {
          withCredentials: true,
          headers: {
              'Content-Type': 'multipart/form-data',
          },
        });
        if (response.status === 200) {
          // Profile photo uploaded successfully
          setProfilePhoto(null);
          setSelectedFile(null);
          const response = await axios.get(`${rootURL}/${username}/getProfile`, { withCredentials: true });
          setProfilePhoto(response.data.profilePhoto);
        } else {
          console.error('Failed to upload profile photo.');
        }
      } catch (error) {
        console.error('Upload profile photo error:', error);
      }
    } else {
      console.warn('No file selected for upload.');
      // Display a warning or error message to the user
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
            onClick={settings}>Profile Settings</button>&nbsp;
          </div>
      </div>

      

      <div className="w-screen h-screen flex items-center justify-center">
        <div>
          <div>Username: {username}</div>
          <div>Email: {email}</div>
          <div>
            Profile Photo: {profilePhoto ? <img src={profilePhoto} alt="Profile" style={{ maxWidth: '100px' }} /> : 'No photo'}
          </div>
          <div>Hashtags: {hashtags.join(", ")}</div>
          <div>Actor: {actor}</div>
          <div>Similar Actors: {similarActors.join(", ")}</div>
        </div>

        <form>
          {/* Input and button to add hashtag */}
          <div className="flex space-x-4 items-center">
          {/* Render recommended hashtags as buttons */}
          <div className="space-x-2">
              {recommendedHashtags.map((hashtag, index) => (
              <button
                  key={index}
                  type="button"
                  className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
                  onClick={() => handleHashtagButtonClick(hashtag)}
              >
                  {hashtag}
              </button>
              ))}
              </div>
          </div>
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
          <button
              type="button"
              className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
              onClick={removeHashtag}
          >
              Remove Hashtag
          </button>

          </div>
          {/* Input and button to reset actor */}
          <div className="flex space-x-4 items-center">
          <input
              id="resetActorInput"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              placeholder="Enter actor name"
              value={newActor}
              onChange={(e) => setNewActor(e.target.value)}
              />
              <button 
              className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white" 
              onClick={() => resetActor(newActor)}>Reset Actor</button>

          </div>
          {/* Input for file upload */}
          <div className="flex space-x-4 items-center">
          <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
              id="fileInput"
          />
          <button
              type="button"
              className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
              onClick={handleFileUpload}
          >
              Upload File
          </button>
      </div>
        </form>
      </div>
    </div>
  );
}
