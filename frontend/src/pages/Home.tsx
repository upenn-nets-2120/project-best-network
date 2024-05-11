import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const friends = () => navigate(`/${username}/friends`);
  const profile = () => navigate(`/${username}/ProfilePage`);
  const chat = () => navigate(`/${username}/chat`);
  const federatedPosts = () => navigate(`/${username}/federated_posts`);
  const search = () => navigate(`/${username}/search`);

  
  
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
  
  const fetchData = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/feed?page=${currentPage}&pageSize=${pageSize}`, { withCredentials: true });
      setPosts(response.data.results);
      setTotalPages(Math.ceil(response.data.totalPosts / pageSize));
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  useEffect(() => {
    axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
    .then((response) => {
        //setIsLoggedIn(response.data.isLoggedIn);
        console.log(response)
        if (!response.data.isLoggedIn){
          navigate("/");
        }

    })
    .catch((error) => {
      navigate("/");
        console.error('Error checking login status:', error);
    });
    fetchData();
  }, []);

  useEffect(() => {
    
    fetchData();
  }, [currentPage, pageSize, username]);

  const handlePostCreation = () => {
    // Refresh posts when a new post is created
    fetchData();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className='w-screen h-screen'>
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
                Pennstagram - {username} &nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={friends}>Friends</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={chat}>Chat</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={logout}>Logout</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={profile}>Profile</button>
                <div style={{ width: '5px' }} />
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={federatedPosts}>Federated Posts</button>
                <div style={{ width: '5px' }} />
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={search}>Search</button>
            </div>
        </div>
        
        <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
        <CreatePostComponent onPostCreation={handlePostCreation} />
          {
            // Map each post to a PostComponent
            posts.map(post => (
                <PostComponent key={post.post_id} title={post.title} post_id={post.post_id} user={post.username} description={post.content} />
            ))
          }
          <div>
            {currentPage > 1 && <button onClick={() => goToPage(currentPage - 1)}>Previous Page</button>}
            {currentPage < totalPages && <button onClick={nextPage}>Next Page</button>}
          </div>
        </div>
    </div>
  )
}