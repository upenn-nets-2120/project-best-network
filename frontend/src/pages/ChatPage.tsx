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
    room: Room;
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

    const [currentRoom, setCurrentRoom] = useState<Room>();
    const { username } = useParams();

    const navigate = useNavigate(); 
    const home = () => {
        navigate("/");
    };

    const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]); // Specify the type as Invite[]

   const acceptInvite = (invite: Invite) => {
    console.log("Invite accepted:", invite);
    socket.emit('accept_invite', { invite });
    setIncomingInvites(prevInvites => 
        prevInvites.filter(prevInvite => 
            prevInvite !== invite || (prevInvite.room?.roomID !== invite.room?.roomID && (prevInvite.room !== null || invite.room !== null))
        )
        );
    };

    const declineInvite = (invite: Invite) => {
        console.log("Invite declined:", invite);
        socket.emit('decline_invite', { invite });
        setIncomingInvites(prevInvites => 
            prevInvites.filter(prevInvite => 
                prevInvite !== invite || (prevInvite.room?.roomID !== invite.room?.roomID && (prevInvite.room !== null || invite.room !== null))
            )
        );
    };



    useEffect(() => {
        // Check if logged in 
        console.log(currentRoom)
        axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
            .then((response) => {
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
            setConnectedUsers(prevUsers => {
                if (!prevUsers.includes(username)) {
                    return [...prevUsers, username];
                }
                return prevUsers;
            });
        });

        socket.on('user_disconnected', ({ username }) => {
            setConnectedUsers(prevUsers => prevUsers.filter(user => user !== username));
        });

        socket.on('chat_rooms', async (rooms:Room[]) => {
            setRooms(rooms)
            setCurrentRoom(rooms[0])
            await getRoomMessages(rooms[0])
        });
        
        socket.on('join_room', (roomID) => {
            socket.emit('join_room', roomID);
        });

        socket.on('chat_room', async (room:Room) => {
            setRooms(prevRooms => {
                const existingRoom = prevRooms.find(existingRoom => existingRoom.roomID === room.roomID);
                if (existingRoom) {
                    return prevRooms.map(existingRoom => {
                        if (existingRoom.roomID === room.roomID) {
                            return room; 
                        }
                        return existingRoom; 
                    });
                } else {
                    return [...prevRooms, room];
                }
            });
            
            setCurrentRoom(room)
            getRoomMessages(room)
        });


        // Listen for incoming messages specific to a room
        socket.on('receive_room_message', (message) => {
            console.log("Message received:", message);
            setMessages(prevMessages => [...prevMessages, message]);
        });

        socket.on('receive_chat_invite', (invite:Invite) => {
            console.log("Received chat invite:", invite);
            const existingInviteIndex = incomingInvites.findIndex(existingInvite => 
            (existingInvite.room?.roomID === invite.room?.roomID || existingInvite.room === null) 
            && existingInvite.senderUsername === invite.senderUsername
            );

            if (existingInviteIndex !== -1) {
                console.log("Duplicate invite received.");
            } else {
                setIncomingInvites(prevInvites => [...prevInvites, invite]);
            }
        });

        // Clean up: remove the message and user_connected listeners
        return () => {
            socket.off('room_message');
            socket.off('user_connected');
        };
    }, []);

    const switchCurrentRoom = async(room:Room) => {
        setCurrentRoom(room)
        getRoomMessages(room)
    }
    const leaveCurrentRoom = async() => {
        socket.emit('leave_room', { room: currentRoom, username: username });
    }

    const getRoomMessages = async (room: Room) => {
        await axios.post(`${rootURL}/${username}/roomMessages`, {
            room_id: room.roomID
        }).then((response) => {
            setMessages(response.data);
        }).catch((error) => {
            console.error('Error fetching room messages:', error);
        });
    }

    const sendMessage = () => {
        if (true) {
            socket.emit('send_room_message', { room: currentRoom , message: currentMessage, senderUsername: username });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    // Function to send invite to a room
    const sendInviteToCurrentRoom = () => {
        //check if valid invite ie invite username not in current room
        if (currentRoom != null  && currentRoom.users.indexOf(inviteUsername) === -1){
            socket.emit('send_group_chat_invite', { room: currentRoom, senderUsername: username, inviteUsername });
        }
        
    };

    // Function to send a chat invitation
    const sendChatInvite = () => {
        socket.emit('send_chat_invite', { senderUsername: username, inviteUsername });
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
                    <button 
                        onClick={() => switchCurrentRoom(room)} 
                        className={`px-4 py-2 rounded ${currentRoom && currentRoom.roomID === room.roomID ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                    >
                        <strong>Room ID:</strong> {room.roomID}
                        <ul>
                            {room.users.map((user, index) => (
                                <li key={index}>{user}</li>
                            ))}
                        </ul>
                    </button>
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
        {currentRoom && currentRoom.users && (
            <div className={'font-bold text-3xl'}>{currentRoom.users.join(', ')}</div>
        )}
        <button onClick={handleLeaveRoom} className="bg-red-500 text-white px-4 py-2 rounded">
            Leave Current Room
        </button>
            <div className='h-[40rem] w-[30rem] bg-slate-100 p-3'>
                <div className='h-[90%] overflow-scroll'>
                    <div className='space-y-2'>
                        {messages.map((msg, index) => {
                            return (
                                <MessageComponent key={index} sender={msg.sender} message={msg.message} timestamp={msg.timestamp} />
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
