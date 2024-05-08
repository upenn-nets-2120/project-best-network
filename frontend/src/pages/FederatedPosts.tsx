import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import CreateFederatedPostComponent from '../components/CreateFederatedPostComponent.tsx';
import PostComponent from '../components/PostComponent';

export default function FederatedPostsPage() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); 

  const home = () => navigate(`/${username}/home`);
  const friends = () => navigate(`/${username}/friends`);
  const profile = () => navigate(`/${username}/ProfilePage`);
  const chat = () => navigate(`/${username}/chat`);
  
  const logout = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/logout`, { withCredentials: true });
      if (response.status === 200) {
        navigate("/");
      } else {
        alert('Could not logout.');
      }
    } catch (error) {
       console.error('Error logging out:', error);
    }
  };

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${rootURL}/${username}/feed`, { withCredentials: true });
        setPosts(response.data.results);  
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className='w-screen h-screen'>
      <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
        <div className='text-2xl max-w-[1800px] w-full flex items-center'>
          Pennstagram - {username} &nbsp;
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={home}>Home</button>
          <div style={{ width: '5px' }} />
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={friends}>Friends</button>&nbsp;
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={chat}>Chat</button>&nbsp;
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={logout}>Logout</button>&nbsp;
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={profile}>Profile</button>&nbsp;
        </div>
      </div>
      
      <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
        <CreateFederatedPostComponent updatePosts={setPosts} />
        {posts.map(post => (
          <PostComponent key={post.post_id} title={post.title} post_id={post.post_id} user={post.username} description={post.content} />
        ))}
      </div>
    </div>
  );
}