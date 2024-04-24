import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;
const socket = io(rootURL);

const ChatPage = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [room, setRoom] = useState('1'); // Set the default room on state initialization
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const { username } = useParams();

    useEffect(() => {
        // Check if logged in 
        axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
            .then((response) => {
                console.log(response)
                setIsLoggedIn(response.data.isLoggedIn);
            })
            .catch((error) => {
                console.error('Error checking login status:', error);
            });

        // Emit 'connected' event with username
        socket.emit("connected", { username: username });

        // Listen for 'user_connected' event to update connected users
        socket.on('user_connected', ({ username }) => {
            setConnectedUsers(prevUsers => [...prevUsers, username]);
        });

        // Listen for incoming messages specific to a room
        socket.on('room_message', (message) => {
            console.log("Message received:", message);
            setMessages(prevMessages => [...prevMessages, message]);
        });

        // Clean up: remove the message and user_connected listeners
        return () => {
            socket.off('room_message');
            socket.off('user_connected');
        };
    }, []);

    // Function to handle room join
    const handleRoomJoin = (e: ChangeEvent<HTMLInputElement>) => {
        setRoom(e.target.value);
    };

    // Function to send a message
    const sendMessage = () => {
        console.log("Sending message to room:", room);
        if (room) {
            socket.emit('send_room_message', { room, message: currentMessage });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    // Function to send invite to a room
    const sendInviteToRoom = (inviteeId: string) => {
        socket.emit('send_invite_to_room', { room, inviteeId });
        console.log(`Invite sent to user with ID ${inviteeId} for room ${room}`);
    };

    // Function to send a chat invitation
    const sendChatInvite = (userId: string) => {
        socket.emit('send_chat_invite', { userId });
        console.log(`Chat invite sent to user ID ${userId}`);
    };

    // Render UI
    if (!isLoggedIn) {
        return <div>Page can't be accessed. Please log in first.</div>;
    }

    return (
        <div>
            {/* Display connected users */}
            <div>
                <h2>Connected Users:</h2>
                {connectedUsers.map((user, index) => (
                    <p key={index}>{user}</p>
                ))}
            </div>

            {/* Input field for specifying the room to join */}
            <input
                type="text"
                placeholder="Enter Room ID"
                value={room}
                onChange={handleRoomJoin}
            />

            {/* Display the messages */}
            <div>
                {messages.map((message, index) => (
                    <p key={index}>{message}</p>
                ))}
            </div>

            {/* Input field for sending new messages */}
            <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type a message..."
            />
      
            {/* Button to send message */}
            <button onClick={sendMessage}>Send</button>

            {/* Input field for sending invite to room */}
            <input
                type="text"
                placeholder="Enter User ID to Invite to Room"
                onChange={(e) => sendInviteToRoom(e.target.value)}
            />

            {/* Input field for sending chat invite */}
            <input
                type="text"
                placeholder="Enter User ID to Send Chat Invite"
                onChange={(e) => sendChatInvite(e.target.value)}
            />
        </div>
    );
};

export default ChatPage;
