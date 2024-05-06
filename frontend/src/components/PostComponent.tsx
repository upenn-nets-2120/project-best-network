import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

export default function PostComponent({
    post_id,
    title = 'Post title',
    user = 'arnavchopra',
    description = 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
    initialLikes = 0,
}) {
    const [likes, setLikes] = useState(initialLikes);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const { username } = useParams();

    // Handle liking a post
    const handleLike = async () => {
        try {
            const response = await axios.post(`${config.serverRootURL}/${username}/sendLike`, { post_id }, { withCredentials: true });
            if (response.status === 201) {
                setLikes((prevLikes) => prevLikes + 1);
            }
        } catch (error) {
            console.error('Error liking post:', error);
            alert('Error liking post.');
        }
    };

    // Handle adding a comment to a post
    const handleAddComment = async () => {
        // Ensure the new comment is not empty
        if (!newComment.trim()) {
            alert('Please enter a valid comment.');
            return;
        }

        try {
            // Prepare the request payload for adding a comment
            const payload = {
                title: 'Comment',
                content: newComment,
                parent_id: post_id,
                hashtags: [], 
                username: username,
            };

            // Make a POST request to the createPost API endpoint to add a comment
            const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, payload, {
                withCredentials: true,
            });

            // Check if the response is successful
            if (response.status === 201) {
                // Append the new comment to the existing comments
                const newComment = response.data.comment;
                setComments((prevComments) => [...prevComments, newComment]);
                // Clear the new comment input field
                setNewComment('');
            }
        } catch (error) {
            // Handle errors
            console.error('Error adding comment:', error);
            alert('Error adding comment.');
        }
    };

    // // Fetch comments for the post
    // const fetchComments = async () => {
    //     try {
    //         const response = await axios.get(`${config.serverRootURL}/${username}/getComment`, {
    //             params: {
    //                 post_id: post_id,
    //             },
    //             withCredentials: true,
    //         });

    //         // Set the comments state with the response data
    //         if (response.status === 200) {
    //             setComments(response.data.comments);
    //         } else {
    //             console.error('Failed to fetch comments.');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching comments:', error);
    //         alert('Error fetching comments.');
    //     }
    // };

    // // Fetch comments when the component mounts
    // useEffect(() => {
    //     fetchComments();
    // }, []);

    // Construct the S3 image URL based on post_id
    const s3ImageUrl = `https://best-network-nets212-sp24.s3.amazonaws.com//posts/${post_id}`;

    // Render the PostComponent
    return (
        <div className="rounded-md bg-slate-50 p-6 w-full max-w-md space-y-2">
            {/* Post user and title */}
            <div className="text-slate-800 mb-2">
                <span className="font-semibold">@{user}</span> posted
            </div>
            <div className="text-2xl font-bold">{title}</div>
            <div>{description}</div>

            {/* Display the image using the constructed S3 image URL */}
            <div className="image-container mt-2">
                <img src={s3ImageUrl} alt={`${title}`} style={{ maxWidth: '100%' }} />
            </div>

            {/* Likes and comments */}
            <div className="flex space-x-4 mt-2">
                <button onClick={handleLike} className="px-2 py-1 rounded-md bg-blue-500 text-white">Like</button>
                <span>Likes: {likes}</span>
            </div>

            {/* Add comment */}
            <div className="flex flex-col space-y-2 mt-2">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="border rounded-md p-2"
                />
                <button onClick={handleAddComment} className="px-2 py-1 rounded-md bg-blue-500 text-white">
                    Add Comment
                </button>
            </div>

            {/* Render comments */}
            <div className="mt-2">
                <ul>
                    {comments.map((comment, index) => (
                        <li key={index} className="border-b p-2">{comment}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
