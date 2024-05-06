import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

function CreatePostComponent({ updatePosts }) {
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // State variables for form inputs
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);

    // Event handler for file input change
    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        setImage(file);
    };

    // Event handlers for text input changes
    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };

    const handleContentChange = (event) => {
        setContent(event.target.value);
    };

    // Function to parse hashtags from the content
    const parseHashtags = (content) => {
        // Regex pattern to match hashtags
        const hashtagPattern = /#\w+/g;
        // Match all hashtags in the content and return them as an array
        const hashtagsArray = content.match(hashtagPattern) || [];
        // Remove the `#` from each hashtag and return the array
        return hashtagsArray.map(tag => tag.slice(1));
    };

    // Event handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validate that at least one field (content or image) is not empty
        if (!content && !image) {
            alert('Post must contain some content or an image.');
            return;
        }

        // Parse hashtags from the content
        const hashtagsArray = parseHashtags(content);

        // Create a JavaScript object for the post data
        const postData = {
            title,
            content,
            hashtags: hashtagsArray,
            username,
        };

        try {
            // Send a POST request to the server with JSON data
            const response = await axios.post(`${rootURL}/${username}/createPost`, postData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                console.log('Post created successfully:', response.data);

                // If there is an image, upload it using multipart form data
                if (image) {
                    const formData = new FormData();
                    formData.append('post', image);

                    const imageResponse = await axios.post(`${rootURL}/${username}/uploadPost`, formData, {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    console.log('Image uploaded successfully:', imageResponse.data);
                }

                // Update posts to refresh the feed
                updatePosts();

                // Reset form fields
                setTitle('');
                setContent('');
                setImage(null);
            } else {
                console.error('Failed to create post:', response);
                alert('Failed to create post.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post.');
        }
    };

    // Render the form
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
                            onChange={handleTitleChange}
                        />
                    </div>
                    <div className="flex space-x-4 items-center justify-between">
                        <label htmlFor="content" className="font-semibold">Content</label>
                        <textarea
                            id="content"
                            placeholder="Content"
                            value={content}
                            onChange={handleContentChange}
                            className="border border-gray-300 p-2 rounded-md"
                            rows={4}
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
