import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';

interface Post {
  post_id: number;
  title: string;
  username: string;
  content?: string;
  initialLikes?: number;
}

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
      
      // Log total posts and division result
      console.log('Total Posts:', response.data.totalPosts);
      console.log('Division Result:', response.data.totalPosts / pageSize);

      // Calculate total pages
      const totalPages = Math.ceil(response.data.totalPosts / pageSize);

      // Set the state
      setPosts(response.data.results);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Handle error: Display an error message or perform necessary actions
    }
  };
  
  useEffect(() => {
    axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
    .then((response) => {
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
    const fetchData = async () => {
      try {
        const response = await axios.get(`${rootURL}/${username}/feed?page=${currentPage}&pageSize=${pageSize}`, { withCredentials: true });
        console.log('Feed response:', response.data); // Add this line
        setPosts(response.data.results);
        setTotalPages(Math.ceil(response.data.totalPosts / pageSize));
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchData();
  }, [currentPage, pageSize, username]);
  

  const handlePostCreation = async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Error fetching posts after post creation:', error);
    }
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
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'onClick={federatedPosts}>Federated Posts</button>
          <div style={{ width: '5px' }} />
          <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white' onClick={search}>Search</button>
        </div>
      </div>

      <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
        <CreatePostComponent onPostCreation={handlePostCreation} />
        {posts.map(post => (
          <PostComponent key={post.post_id} title={post.title} post_id={post.post_id} user={post.username} description={post.content} />
        ))}
        <div>
          {currentPage > 1 && <button style={{padding: '8px 16px', marginRight: '8px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer'}} onClick={() => goToPage(currentPage - 1)}>Previous Page</button>}
          {currentPage < totalPages && <button style={{padding: '8px 16px', marginRight: '8px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer'}} onClick={nextPage}>Next Page</button>}
        </div>
      </div>
    </div>
  );
}
