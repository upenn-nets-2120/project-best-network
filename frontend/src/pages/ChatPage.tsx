import { useState } from 'react'
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import config from '../../config.json';


// Define the type for the props expected by the ChatPage component
type ChatPageProps = {
  socket: WebSocket;  // or use 'any' if the type is not specifically WebSocket
};

const ChatPage: React.FC<ChatPageProps> = ({ socket }) => {
  return (
    <div className="chat">
      <div className="chat__main">
        {/* Content here */}
      </div>
    </div>
  );
};

export default ChatPage;
