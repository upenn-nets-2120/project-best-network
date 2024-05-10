import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { v4 as uuidv4 } from 'uuid';
import PostCompoennt from "../components/PostComponent"

function CreatePostComponent({  onPostCreation  }) {
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const navigate = useNavigate(); 

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        setImage(file);
    };

    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };

    const handleContentChange = (event) => {
        setContent(event.target.value);
    };

    const parseHashtags = (content) => {
        const hashtagPattern = /#\w+/g;
        const hashtagsArray = content.match(hashtagPattern) || [];
        return hashtagsArray.map(tag => tag.slice(1));
    };

    const post_uuid = uuidv4();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        if (!content && !image) {
            alert('Post must contain some content or an image.');
            setIsSubmitting(false);
            return;
        }

        const hashtagsArray = parseHashtags(content);

        const postData = {
            title,
            content,
            hashtags: hashtagsArray,
            username,
            uuid: post_uuid,
        };

        try {
            const response = await axios.post(`${rootURL}/${username}/createPost`, postData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                console.log('Post created successfully:', response.data);

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

                console.log(response.data);
                onPostCreation();

                setTitle('');
                setContent('');
                setImage(null);
                navigate("/" + username + "/home");
            } else {
                console.error('Failed to create post:', response);
                alert('Failed to create post.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post.');
        }

        setIsSubmitting(false);
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
                            disabled={isSubmitting}
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