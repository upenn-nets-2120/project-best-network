import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;
const socket = io(rootURL);


// import { Socket } from "socket.io-client";
// interface ChatPageProps {
//   socket: Socket;  // Using Socket type for the socket instance
// }




const ChatPage = ({  }) => {
    const [messages, setMessages] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [room, setRoom] = useState('1'); // Set the default room on state initialization
    const { username } = useParams();

    useEffect(() => {
        //check if logged in 
        axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
        .then((response) => {
            setIsLoggedIn(response.data.loggedIn);
        })
        .catch((error) => {
            console.error('Error checking login status:', error);
        });

        // Listen for incoming messages specific to a room
        socket.on('room_message', (message) => {
            console.log("Message received:", message);
            setMessages(prevMessages => [...prevMessages, message]);
        });

        // Clean up: remove the message listener
        return () => {
            socket.off('room_message');
        };
    }, []);

    useEffect(() => {
        if (room) {
            console.log("Joining room:", room)
            socket.emit('join_room', { room_name: room, username: username });
            
            axios.get(`${rootURL}/${username}/messages`, { params: { room: room } })
            .then(response => {
              setMessages(response.data.messages);
            })
            .catch(error => {
              console.error('Error fetching messages:', error);
              // Handle error appropriately
            });

            // Leave the room when the component unmounts or room changes
            return () => {
                console.log("Leaving room:", room);
                socket.emit('leave_room', { room });
            };
        }
    }, [room]); // This effect runs when 'room' changes

    const sendMessage = () => {
        console.log("Sending message to room:", room);
        if (room) {
            socket.emit('send_room_message', { room, message: currentMessage });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    const handleRoomJoin = (e: ChangeEvent<HTMLInputElement>) => {
        setRoom(e.target.value);
    };

    const sendInvite = (inviteeId : string) => {
      socket.emit('send_invite', { room, inviteeId });
    };
  
    if (!isLoggedIn) {
      return <div>Page can't be accessed. Please log in first.</div>;
    }

    return (
        <div>
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
      
            {/* Button to submit the new message */}
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatPage;
