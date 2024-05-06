import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import { integer } from 'aws-sdk/clients/cloudfront';

export default function Home() {

  const { username } = useParams();
  const rootURL = config.serverRootURL;

  const navigate = useNavigate(); 

  const friends = () => {
      navigate("/"+ username+"/friends");
  };

  const profile = () => {
    navigate("/"+ username+"/ProfilePage");
  };

  const chat = () => {
    navigate("/"+ username+"/chat");
  };
  
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
  }
  
    // TODO: add state variable for posts

    const fetchData = async () => {
      try {
        const response = await axios.get(`${rootURL}/${username}/feed`, { withCredentials: true });
          setPosts(response.data.results); 
      } catch (error) {
          console.error('Error fetching posts:', error);
      }
  };

  
    interface Post {
        title: string;
        username: string;
        content: string;
        post_id: integer;
    }
    const [posts, setPosts] = useState<Post[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            // TODO: fetch posts data and set appropriate state variables 
            try {
              const response = await axios.get(`${rootURL}/${username}/feed`, { withCredentials: true });
              console.log(response)
              setPosts(response.data.results);  
              console.log(response.data.results); 
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
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={friends}>Friends</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={chat}>Chat</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={logout}>Logout</button>&nbsp;
              <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={profile}>Profile</button>

            </div>
        </div>
        
        <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
          <CreatePostComponent updatePosts={fetchData} />
          {
            // TODO: map each post to a PostComponent
            posts.map(post => (
                <PostComponent key={post.post_id} title={post.title}
                post_id = {post.post_id}
                user={post.username}
                description={post.content}
                />
            ))
          }
        </div>
    </div>
  )
}


