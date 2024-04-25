import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;
const socket = io(rootURL);
import InviteComponent from '../components/InviteComponent'
import MessageComponent from '../components/MessageComponent'

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

interface Message {
    sender: string;
    message: string;
    timestamp: number;
}



const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    const [currentRoomID, setCurrentRoomID] = useState<number>();
    const { username } = useParams();

    const navigate = useNavigate(); 
    const home = () => {
        navigate("/");
    };

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
    const sendInviteToCurrentRoom = () => {
        if (currentRoomID != null){
            socket.emit('send_group_chat_invite', { room_id: currentRoomID, senderUsername: username, inviteUsername });
            console.log(`Invite sent to user with ID ${inviteUsername} for room ${currentRoomID}`);
        }
        
    };

    // Function to send a chat invitation
    const sendChatInvite = () => {
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

            <div className="flex items-center mb-4">
                <input
                    type="text"
                    placeholder="Invite User to Current Room"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 mr-2 flex-grow"
                />
                <button onClick={sendInviteToCurrentRoom} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Send Invite to Current Room
                </button>
                <button onClick={sendChatInvite} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Send New Chat Invite
                </button>

            </div>
            

    <div className='w-screen h-screen flex flex-col items-center'>
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
            Pennstagram - {username} &nbsp;
            <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={home}>Home</button>&nbsp;
       
            </div>
        </div>
            <div className='font-bold text-3xl'>Internet Movie DB Chat</div>
            <div className='h-[40rem] w-[30rem] bg-slate-100 p-3'>
                <div className='h-[90%] overflow-scroll'>
                    <div className='space-y-2'>
                        {messages.map(msg => {
                            return (
                                <MessageComponent sender={msg.sender} message={msg.message} timestamp={msg.timestamp} />
                            )
                        })}
                    </div>
                </div>
                <div className='w-full flex space-x-2'>
                    <input className='w-full outline-none border-none px-3 py-1 rounded-md'
                        placeholder='Ask something!'
                        onChange={e => setCurrentMessage(e.target.value)}
                        value={currentMessage}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                sendMessage();
                                setCurrentMessage('');
                            }
                        }} />
                    <button className='outline-none px-3 py-1 rounded-md text-bold bg-indigo-600 text-white'
                        onClick={() => {
                            sendMessage();
                        }}>Send</button>
                </div>
            </div>
        </div>
        </div>

        
    );
};

export default ChatPage;
