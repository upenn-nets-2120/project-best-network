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
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null); 
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    setImage(file);
  };

  const post_uuid = uuidv4();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      let imageUrl = '';
      // Check if there is an image selected
      if (image) {
        const formData = new FormData();
        formData.append('post', image);
  
        // Upload the image and get the public URL
        console.log('Uploading image...');
        const imageResponse = await axios.post(`${rootURL}/${username}/uploadFederatedPost`, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        console.log('Image uploaded successfully:', imageResponse.data);
  
        imageUrl = imageResponse.data.photoURL;
      }
  
      console.log('Image URL:', imageUrl);
  
      const attachLink = imageUrl ? `<img src="${imageUrl}" alt="Image" />` : null;
  
      console.log('Attach Link:', attachLink);
  
      const postData = {
        post_text: content,
        username,
        source_site: "g13",
        post_uuid_within_site: post_uuid,
        attach: attachLink,
        content_type: "text/html"
      };
  
      console.log('Post Data:', postData);
  
      const response: AxiosResponse<Post> = await axios.post(`${rootURL}/${username}/createFederatedPost`, postData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Post Response:', response.data);
  
      if (response.status === 201 || response.status === 200) {
        console.log('Post created successfully:', response.data);
        updatePosts(prevPosts => [...prevPosts, response.data]);
        setContent('');
        setImage(null);
      } else {
        console.error('Failed to create post:', response);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
    alert('Post successfully created');
  };  

  return (
    <div className="w-screen h-screen flex justify-center">
      <form onSubmit={handleSubmit}>
        <div className="rounded-md bg-slate-50 p-6 space-y-2 w-full max-w-md">
          <div className="font-bold flex w-full justify-center text-2xl mb-4">
            Create Federated Post
          </div>
          <div className="flex flex-col space-y-4">
            <div>
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
            <div>
              <label htmlFor="image" className="block text-gray-700 font-bold mb-2">Image</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border rounded-md px-3 py-2 outline-none focus:border-blue-500"
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
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateFederatedPostComponent;