import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

interface Comment {
    username: string;
    content: string;
}

interface PostComponentProps {
    post_id: number;
    title?: string;
    user?: string;
    description?: string;
    initialLikes?: number;
}
  
  export default function PostComponent({
    post_id,
    title = '',
    user = '',
    description = '',
    initialLikes = 0,
  }: PostComponentProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [comments, setComments] = useState<Comment[]>([]);
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
        setLikes(response.data.likes);
      } else {
        console.error('Failed to fetch initial likes.');
      }
    } catch (error) {
      console.error('Error fetching initial likes:', error);
    }
  };


  const fetchComments = async () => {
    try {
    
      const response = await axios.get(`${config.serverRootURL}/${username}/getComment`, {
        params: { post_id },
        withCredentials: true,
      });

      if (response.status === 200) {
        setComments(response.data.results);
      } else {
        console.error('Failed to fetch comments.');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Fetch initial likes and comments when the component mounts
  useEffect(() => {
    fetchInitialLikes();
    fetchComments();
  }, [post_id, username]);

 
  const handleLike = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/sendLike`, { post_id }, { withCredentials: true });
      if (response.status === 201) {
        setLikes((prevLikes) => prevLikes + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    // validate comment first
    if (!newComment.trim()) {
      alert('Please enter a valid comment.');
      return;
    }


    const payload = {
      title: 'Comment',
      content: newComment,
      parent_id: post_id,
      hashtags: [],
      username,
    };

    try {
      const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        // if the comment is added successfully, fetch the updated comments
        fetchComments();
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


  const s3ImageUrl = `https://best-network-nets212-sp24.s3.amazonaws.com//posts/${post_id}`;

  // skip rendering if the post title is "Comment"
  if (title === 'Comment') {
    return null; 
  }

  return (
    <div className="rounded-md bg-slate-50 p-6 w-full max-w-md space-y-2">
      {/* post user and title */}
      <div className="text-slate-800 mb-2">
        <span className="font-semibold">@{user}</span> posted
      </div>
      <div className="text-2xl font-bold">{title}</div>
      <div>{description}</div>

      {/* display the image using the constructed S3 image URL */}
      {s3ImageUrl && s3ImageUrl.trim() !== "" && (
      <div className="image-container mt-2">
        <img src={s3ImageUrl} style={{ maxWidth: '100%' }} />
      </div>
    )}

      {/* ;ikes and comments */}
      <div className="flex space-x-4 mt-2">
        <button onClick={handleLike} className="px-2 py-1 rounded-md bg-blue-500 text-white">Like</button>
        <span>Likes: {likes}</span>
      </div>

      {/* add comment */}
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

      {/* render comments */}
      <div className="mt-2">
        <ul>
          {comments.map((comment, index) => (
            <li key={index} className="border-b p-2">
              <strong>@{comment.username}</strong>: {comment.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
