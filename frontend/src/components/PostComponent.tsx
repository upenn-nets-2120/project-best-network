import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

export default function PostComponent({
  post_id,
  title = 'Post title',
  user = 'arnavchopra',
  description = 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
  initialLikes = 0,
  initialComments = [],
}) {
  console.log('Post ID:', post_id);
  
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const { username } = useParams();

  // Handle liking a post
  const handleLike = async () => {
    try {
        // Send a POST request to the server to like the post
        const response = await axios.post(`${config.serverRootURL}/${username}/sendLike`, { post_id: post_id }, { withCredentials: true });
        
        // If successful, increment the likes count
        if (response.status === 201) {
            setLikes((prevLikes) => prevLikes + 1);
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
  };

  // Handle adding a comment to a post
  const handleAddComment = async () => {
    if (!newComment.trim()) {
        alert('Please enter a valid comment.');
        return;
    }

    try {
        // Send a POST request to the server to add a comment to the post
        const response = await axios.post(`${config.serverRootURL}/${user}/addComment`, {
            post_id,
            comment: newComment,
        }, { withCredentials: true });
        
        // If successful, add the new comment to the list of comments
        if (response.status === 201) {
            setComments((prevComments) => [...prevComments, response.data.comment]);
            // Clear the new comment input field
            setNewComment('');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
  };

  // Construct the S3 image URL based on post_id
  const s3ImageUrl = `https://best-network-nets212-sp24.s3.amazonaws.com//posts/${post_id}`;

  return (
    <div className="rounded-md bg-slate-50 w-full max-w-[1000px] space-y-2 p-3">
        <div className="text-slate-800">
            <span className="font-semibold">@{user}</span> posted
        </div>
        <div className="text-2xl font-bold">
            {title}
        </div>
        <div>
            {description}
        </div>
        {/* Display the image using the constructed S3 image URL */}
        <div className="image-container">
            <img src={s3ImageUrl} alt={`${title}`} style={{ maxWidth: '100%' }} />
        </div>
        <div className="flex space-x-4">
            <button onClick={handleLike}>Like</button>
            <span>Likes: {likes}</span>
        </div>
        <div className="flex flex-col">
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
            />
            <button onClick={handleAddComment}>Add Comment</button>
        </div>
        <div>
            <ul>
                {comments.map((comment, index) => (
                    <li key={index}>{comment}</li>
                ))}
            </ul>
        </div>
    </div>
  );
}
