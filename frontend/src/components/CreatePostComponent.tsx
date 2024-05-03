import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

function CreatePostComponent({ updatePosts }) {
    const { username } = useParams();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [hashtags, setHashtags] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleHashtagsChange = (event) => {
        const input = event.target.value;
        setHashtags(input);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validate that at least one field (content, image, or hashtags) is not empty
        if (!content && !image && hashtags.trim() === '') {
            alert('Post must contain some content, an image, or hashtags.');
            return;
        }

        // Create FormData object
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('hashtags', hashtags);
        if (image) {
            formData.append('image', image);
        }

        console.log(title); 
        console.log(content); 
        console.log(hashtags); 

        try {
            // Send a POST request to the server
            const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Post created successfully:', response.data);
            updatePosts(); 

            // Reset form fields after successful post creation
            setTitle('');
            setContent('');
            setHashtags('');
            setImage(null);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post.');
        }
    };

    return (
        <div className="w-screen h-screen flex justify-center">
            <form onSubmit={handleSubmit}>
                <div className="rounded-md bg-slate-50 p-6 space-y-2 w-full max-w-md">
                    <div className="font-bold flex w-full justify-center text-2xl mb-4">
                        Create Post
                    </div>
                    <div className="flex space-x-4 items-center justify-between">
                        <label htmlFor="title" className="font-semibold">Title</label>
                        <input
                            id="title"
                            type="text"
                            className="outline-none bg-white rounded-md border border-slate-100 p-2"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-4 items-center justify-between">
                        <label htmlFor="content" className="font-semibold">Content</label>
                        <textarea
                            id="content"
                            placeholder="Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="border border-gray-300 p-2 rounded-md"
                            rows={4}
                        />
                    </div>
                    <div className="flex space-x-4 items-center justify-between">
                        <label htmlFor="hashtags" className="font-semibold">Hashtags</label>
                        <input
                            id="hashtags"
                            type="text"
                            className="outline-none bg-white rounded-md border border-slate-100 p-2"
                            value={hashtags}
                            onChange={handleHashtagsChange}
                            placeholder="e.g., #nature, #travel"
                        />
                    </div>
                    <div className="flex space-x-4 items-center justify-between">
                        <label htmlFor="image" className="font-semibold">Photo</label>
                        <input
                            id="image"
                            type="file"
                            className="outline-none bg-white rounded-md border border-slate-100 p-2"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>
                    <div className="w-full flex justify-center">
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
                        >
                            Create Post
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreatePostComponent;
