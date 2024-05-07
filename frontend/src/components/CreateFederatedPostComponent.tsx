import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosResponse } from 'axios'; 
import config from '../../config.json';
import { v4 as uuidv4 } from 'uuid';

interface Post {
  title: string;
  username: string;
  content: string;
  post_id: number;
}

interface CreateFederatedPostComponentProps {
  updatePosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

function CreateFederatedPostComponent({ updatePosts }: CreateFederatedPostComponentProps) {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const post_uuid = uuidv4();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const postData = {
        post_text: content,
        username,
        source_site: "g13", 
        post_uuid_within_site: post_uuid,
        content_type: "text/plain"
      };

      const response: AxiosResponse<Post> = await axios.post(`http://localhost:8080/${username}/createFederatedPost`, postData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 201 || 200) {
        console.log('Post created successfully:', response.data);
        updatePosts(prevPosts => [...prevPosts, response.data]);
        setTitle('');
        setContent('');
      } else {
        console.error('Failed to create post:', response);
        alert('Failed to create post.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-bold mb-2">Title</label>
          <input
            id="title"
            type="text"
            className="w-full border rounded-md px-3 py-2 outline-none focus:border-blue-500"
            value={title}
            onChange={handleTitleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 font-bold mb-2">Content</label>
          <textarea
            id="content"
            className="w-full border rounded-md px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Content"
            value={content}
            onChange={handleContentChange}
            required
          />
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Post
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateFederatedPostComponent;