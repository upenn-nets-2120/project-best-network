import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;

import InviteComponent from '../components/InviteComponent'
import MessageComponent from '../components/MessageComponent'
import { Invite, Room, Message } from '../components/chatRoomInterfaces';

const socket = io(rootURL);

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
    const sameRoomInvites = incomingInvites.filter(i => 
        i.room?.roomID === invite.room?.roomID
    );
    sameRoomInvites.forEach(i => {
        if (i.inviteID != invite.inviteID){
            console.log('here')
            socket.emit('accept_invite', { invite });
        }
    });

    setIncomingInvites(prevInvites => 
        prevInvites.filter(prevInvite => 
            prevInvite.inviteID !== invite.inviteID
        ).filter(prevInvite => 
           prevInvite.room?.roomID !== invite.room?.roomID
        )
        
        );
    
    };

    const declineInvite = (invite: Invite) => {
        console.log("Invite declined:", invite);
        socket.emit('decline_invite', { invite });
        setIncomingInvites(prevInvites => 
            prevInvites.filter(prevInvite => 
                prevInvite.inviteID !== invite.inviteID
            ).filter(prevInvite => 
               prevInvite.room?.roomID !== invite.room?.roomID
            )
            
            );
    };


   
    useEffect(() => {
        // Check if logged in 
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
            alert(`invite accepted by ${invite.inviteUsername}`)
        });
    
        socket.on('invite_declined', (invite:Invite) => {
            alert(`invite declined by ${invite.inviteUsername}`)
        });
    
        socket.on('user_connected', ({ username }) => {
            setConnectedUsers(prevUsers => {
                if (!prevUsers.includes(username)) {
                    return [...prevUsers, username];
                }
                return prevUsers;
            });
        });

        socket.on('force_disconnect', () => {
            console.log("Disconnected from server.");
            setIsLoggedIn(false);  // Set logged in state to false on disconnect
        });
    
        socket.on('user_disconnected', ({ username }) => {
            console.log("here")
            setConnectedUsers(prevUsers => prevUsers.filter(user => user !== username));
        });
        
        socket.on('chat_rooms', async (rooms:Room[]) => {
            setRooms(rooms)
            if (rooms.length > 0){
                await setCurrentRoom(rooms[0])
                await getRoomMessages(rooms[0])
            }
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
        })
        
        socket.on('join_room', (roomID) => {
            socket.emit('join_room', roomID);
        });
    
        
        return () => {
            socket.off('connected_users');
            socket.off('invite_accepted');
            socket.off('invite_declined');
            socket.off('user_connected');
            socket.off('force_disconnect');
            socket.off('user_disconnected');
            socket.off('chat_rooms');
            socket.off('chat_room');
            socket.off('join_room');
            socket.disconnect()
        };
    }, []);

    useEffect(() => {
        // Inside the useEffect hook, update the ref when currentRoomID changes
        socket.on('user_left_room', ({ room, username: leaverUsername }) => {
            if (currentRoom?.roomID == room.roomID){
                setCurrentRoom(room);
            }
            setRooms(prevRooms => 
                prevRooms.map(room => {
                    if (room.roomID === room.roomID) {
                        return {
                            ...room,
                            users: room.users.filter(user => user !== leaverUsername)
                        };
                    }
                    return room;
                })
            );
        });



        // Register the socket event listener
        socket.on('receive_room_message', async (message) => {
            // Access the latest value of currentRoomID using the ref
            if (message.roomID === currentRoom?.roomID) {
                setMessages(prevMessages => [...prevMessages, message]);
            } else {
                setRooms(prevRooms => 
                    prevRooms.map(room => {
                        if (room.roomID === message.roomID) {
                            return { ...room, notification: true, notificationMessage: message.message };
                        }
                        return room;
                    })
                );
            }
            console.log("Message received:", message);
        });
        

        socket.on('receive_chat_invite', async (invite:Invite) => {
            console.log("Received chat invite:", invite);
            const existingInviteIndex = incomingInvites.findIndex(existingInvite => 
            (existingInvite.room?.roomID === invite.room?.roomID || existingInvite.room === null) 
            && existingInvite.senderUsername === invite.senderUsername
            );
            console.log(incomingInvites)
            console.log(invite)
            if (existingInviteIndex !== -1) {
                console.log("Duplicate invite received.");
            } else {
                await setIncomingInvites(prevInvites => [...prevInvites, invite]);
            }
        });

        socket.on('receive_room_messages', async (messages) => {
            console.log("Received room messages:", messages);
            setMessages(messages.messages || [])
        });


        
        // Clean up the event listener when the component unmounts
        return () => {
            socket.off('receive_room_message');
            socket.off('receive_room_messages');
            socket.off('receive_chat_invite');
            socket.off('user_left_room');
        };

    }, [currentRoom, incomingInvites]);


    
    const switchCurrentRoom = async(room:Room) => {
        setRooms(rooms.map(r => {
            if (r.roomID === room.roomID) {
                return { ...r, notification: false, notificationMessage: "" };
            }
            return r;
        }));
        setCurrentRoom(room)
        console.log(messages)
        getRoomMessages(room)
    }
    const sendLeaveRoom = async() => {
        let room: Room | undefined = undefined;
        setCurrentRoom(room);
        setMessages([]);
        setRooms(rooms.filter(room => room.roomID !== currentRoom?.roomID));
        socket.emit('leave_room', { room: currentRoom, username: username });
    }

    const getRoomMessages = async (room: Room) => {
        socket.emit("get_room_messages", {room})
    }

    const sendMessage = () => {
        if (currentRoom != null) {
            socket.emit('send_room_message', { room: currentRoom , message: currentMessage, senderUsername: username });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    // Function to send invite to a room
    const sendInviteToCurrentRoom = () => {
        if (connectedUsers.includes(inviteUsername)) {
            //check if valid invite ie invite username not in current room
            if (currentRoom != null  && currentRoom.users.indexOf(inviteUsername) === -1){
                socket.emit('send_group_chat_invite', { room: currentRoom, senderUsername: username, inviteUsername });
                alert(`invite sent to:${inviteUsername}`)
            }else{
                if (currentRoom != null){
                    alert("user already in room")
                }else{
                    alert("no current room set")
                } 
            }
        } else {
            alert("Invalid invite username");
        }
        
    };

    // Function to send a chat invitation
    const sendChatInvite = () => {
        const existingRoom = rooms.find(room => 
            room.users.length === 2 &&
            room.users.includes(username || '') &&
            room.users.includes(inviteUsername)
        );
    
        if (existingRoom) {
            alert(`You are already in a room with ${inviteUsername}`);
        } else if (connectedUsers.includes(inviteUsername)) {
            socket.emit('send_chat_invite', { senderUsername: username, inviteUsername });
            alert(`invite sent to:${inviteUsername}`)
        } else {
            alert("Invalid invite username");
        }
    };

    // Render UI
    if (!isLoggedIn) {
        return <div>Page can't be accessed. Please log in first.</div>;
    }

    return (
        <div>
            <div>
            <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
            Pennstagram - {username} &nbsp;
            <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={home}>Home</button>&nbsp;
       
            </div>
            </div>
            <div className="mb-4 mx-auto w-1/2">
                <h2 className="text-lg font-bold mb-2">Connected Users:</h2>
                <ul className="bg-gray-100 rounded-lg p-4">
                    {connectedUsers.map((user, index) => (
                        <li key={index} className="py-2 border-b border-gray-200 last:border-b-0">{user}</li>
                    ))}
                </ul>
            </div>
            <div className="flex items-center mb-4 mx-auto w-1/2 space-x-4">
            {rooms.map((room) => (
                <div key={room.roomID}>
                    <button 
                        onClick={() => switchCurrentRoom(room)} 
                        className={`px-4 py-2 rounded ${currentRoom && currentRoom.roomID === room.roomID ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                    >
                        <strong>Room ID:</strong> {room.roomID}
                        <ul>
                            {room.users.map((user, index) => (
                                user !== username && (
                                    <li key={index}>{user}</li>
                                )
                            ))}
                        </ul>
                    </button>
                    {room.notification && (
                        <div className="notification">Notification: {room.notificationMessage}</div>
                    )}
                </div>
            ))}
            </div>

            </div>

           
           
            <div className="flex items-center mb-4 mx-auto w-1/2 space-x-4">
                <select
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 flex-grow mr-2"
                >
                    <option value="">Invite User to Current Room</option>
                    {connectedUsers.map((user, index) => (
                        <option key={index} value={user}>{user}</option>
                    ))}
                </select>
                <button onClick={sendInviteToCurrentRoom} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Send Invite to Current Room
                </button>
                <button onClick={sendChatInvite} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Send New Chat Invite
                </button>
            </div>


            <div className="flex items-center mb-4 mx-auto w-1/2 space-x-4">
                {incomingInvites.map((invite, index) => (
                    <InviteComponent
                        key={index}
                        invite={invite}
                        onAccept={acceptInvite}
                        onDecline={declineInvite}
                    />
                ))}
            </div>
                    

    <div className='w-screen h-screen flex flex-col items-center'>
       
        {currentRoom && currentRoom.users && (
            <div className={'font-bold text-3xl'}>
                Room ID {currentRoom.roomID}:
                {currentRoom.users.filter(user => user !== username).join(', ')}
            </div>
        )}
       {currentRoom !== undefined && (
            <button onClick={sendLeaveRoom} className="bg-red-500 text-white px-4 py-2 rounded">
                Leave Current Room
            </button>
        )}
            <div className='h-[40rem] w-[30rem] bg-slate-100 p-3'>
                <div className='h-[90%] overflow-scroll'>
                    <div className='space-y-2'>
                        {messages.map((msg, index) => {
                            return (
                                <MessageComponent key={index} sender={msg.sender} message={msg.message} timestamp={msg.timestamp} currentUser={username || ''} />
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
