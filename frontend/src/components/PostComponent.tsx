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

  // Fetch initial likes for the post
  const fetchInitialLikes = async () => {
    try {
      const response = await axios.get(`${config.serverRootURL}/${username}/getLikes`, {
        params: { post_id },
        withCredentials: true,
      });

      if (response.status === 200) {
        // Set the likes state with the initial likes from the response
        setLikes(response.data.likes);
      } else {
        console.error('Failed to fetch initial likes.');
      }
    } catch (error) {
      console.error('Error fetching initial likes:', error);
      alert('Error fetching initial likes.');
    }
  };

  // Fetch comments for the post
  const fetchComments = async () => {
    try {
      // Use the URL query string to pass the post_id parameter
      const response = await axios.get(`${config.serverRootURL}/${username}/getComment`, {
        params: { post_id },
        withCredentials: true,
      });

      if (response.status === 200) {
        // Set the comments state with the comments from the response
        setComments(response.data.results);
      } else {
        console.error('Failed to fetch comments.');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('Error fetching comments.');
    }
  };

  // Fetch initial likes and comments when the component mounts
  useEffect(() => {
    fetchInitialLikes();
    fetchComments();
  }, [post_id, username]);

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

  // Handle adding a new comment to the post
  const handleAddComment = async () => {
    // Validate the new comment
    if (!newComment.trim()) {
      alert('Please enter a valid comment.');
      return;
    }

    // Prepare the payload for adding a comment
    const payload = {
      title: 'Comment',
      content: newComment,
      parent_id: post_id,
      hashtags: [],
      username,
    };

    try {
      // Make a POST request to the createPost API to add a comment
      const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        // If the comment is added successfully, fetch the updated comments
        fetchComments();
        // Clear the new comment input field
        setNewComment('');
      } else {
        console.error('Failed to add comment.');
        alert('Failed to add comment.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment.');
    }
  };

  // Construct the S3 image URL based on post_id
  const s3ImageUrl = `https://best-network-nets212-sp24.s3.amazonaws.com//posts/${post_id}`;

  // Skip rendering if the post title is "Comment"
  if (title === 'Comment') {
    return null; 
  }

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
        <img src={s3ImageUrl} style={{ maxWidth: '100%' }} />
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
          {comments.map((comment) => (
            <li key={comment.post_id} className="border-b p-2">
              <strong>@{comment.username}</strong>: {comment.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
