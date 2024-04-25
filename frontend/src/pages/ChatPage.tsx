import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;
const socket = io(rootURL);
import InviteComponent from '../components/InviteComponent'

interface Invite {
    inviteID: number;
    inviteUsername: string;
    senderUsername: string;
    roomID: string;
}

interface Room {
    roomID: number;
    users: string[]
}

const ChatPage = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentRoomID, setCurrentRoomID] = useState<number>();
    const { username } = useParams();


    const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]); // Specify the type as Invite[]
   // Function to accept an invite by ID
    const acceptInvite = (invite: Invite) => {
        console.log("Invite accepted:", invite);
        socket.emit('accept_invite', { invite });
        setIncomingInvites(prevInvites => prevInvites.filter(invite => invite !== invite));
    };
    const declineInvite = (invite: Invite) => {
        console.log("Invite declined:", invite);
        socket.emit('decline_invite', { invite }); 
        setIncomingInvites(prevInvites => prevInvites.filter(invite => invite !== invite));
    };


    useEffect(() => {
        console.log(currentRoomID)
        // Check if logged in 
        axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
            .then((response) => {
                console.log(response)
                setIsLoggedIn(response.data.isLoggedIn);
            })
            .catch((error) => {
                console.error('Error checking login status:', error);
            });

        // Emit 'send_username' event with username
        socket.emit("send_username", { username: username });
        
        socket.on('connected_users', (users: string[]) => {
            setConnectedUsers(users);
        });

        socket.on('invite_accepted', (invite:Invite) => {
            console.log("invite accepted")
        });

        // Listen for 'user_connected' event to update connected users
        socket.on('user_connected', ({ username }) => {
            setConnectedUsers(prevUsers => [...prevUsers, username]);
        });

        socket.on('user_disconnected', ({ username }) => {
            setConnectedUsers(prevUsers => prevUsers.filter(user => user !== username));
        });

        socket.on('chat_rooms', (rooms:Room[]) => {
            setRooms(rooms)
        });

        socket.on('chat_room', ({ roomID, users }: { roomID: number; users: string[] }) => {
            setRooms((prevRooms) => [...prevRooms, { roomID, users }]);
            setCurrentRoomID(roomID)
            axios.get(`${rootURL}/${username}/roomMessages`, {
                params: { room_id: currentRoomID, username: username}, 
            }).then((response) => {
                    setMessages(response.data.messages);
                })
                .catch((error) => {
                    console.error('Error fetching room messages:', error);
                });
        });


        // Listen for incoming messages specific to a room
        socket.on('room_message', (message) => {
            console.log("Message received:", message);
            setMessages(prevMessages => [...prevMessages, message]);
        });

        socket.on('receive_chat_invite', (invite:Invite) => {
            console.log("Received chat invite:", invite);
            setIncomingInvites(prevInvites => [...prevInvites, invite]);
        });

        // Clean up: remove the message and user_connected listeners
        return () => {
            socket.off('room_message');
            socket.off('user_connected');
        };
    }, []);



    const sendMessage = () => {
        console.log("Sending message to room:", currentRoomID);
        if (true) {
            socket.emit('send_room_message', { roomID: currentRoomID, message: currentMessage });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    // Function to send invite to a room
    const sendInviteToCurrentRoom = (inviteUsername: string) => {
        if (currentRoomID != null){
            socket.emit('send_group_chat_invite', { room_id: currentRoomID, senderUsername: username, inviteUsername });
            console.log(`Invite sent to user with ID ${inviteUsername} for room ${currentRoomID}`);
        }
        
    };

    // Function to send a chat invitation
    const sendChatInvite = (inviteUsername: string) => {
        socket.emit('send_chat_invite', { senderUsername: username, inviteUsername });
        console.log(`Chat invite sent to user ID ${inviteUsername}`);
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

            <h2>Rooms and Users:</h2>
            <ul>
                {rooms.map((room) => (
                    <li key={room.roomID}>
                        <strong>Room ID:</strong> {room.roomID}
                        <ul>
                            {room.users.map((user, index) => (
                                <li key={index}>{user}</li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            </div>

            {incomingInvites.map((invite, index) => (
                <InviteComponent
                    key={index}
                    invite={invite}
                    onAccept={acceptInvite}
                    onDecline={declineInvite}
                />
            ))}

            
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
                placeholder="Invite User to Current Room"
                onChange={(e) => sendInviteToCurrentRoom(e.target.value)}
            />

            {/* Input field for sending chat invite */}
            <input
                type="text"
                placeholder="Enter Username to Send Chat Invite"
                onChange={(e) => sendChatInvite(e.target.value)}
            />
        </div>
    );
};

export default ChatPage;
