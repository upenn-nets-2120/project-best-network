import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import axios from 'axios';
import config from '../../config.json';
const rootURL = config.serverRootURL;

import InviteComponent from '../components/ChatInviteComponent'
import MessageComponent from '../components/ChatMessageComponent'
import { Invite, Room, Message } from '../Interfaces/chatRoomInterfaces';

const socket = io(rootURL);

const ChatPage = () => {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]); //list of usernames
    const [rooms, setRooms] = useState<Room[]>([]); //list of rooms that user belongs to

    const [currentRoom, setCurrentRoom] = useState<Room>(); //current room state
    const [messages, setMessages] = useState<Message[]>([]); //list of messages for current room: when user changes current room, this will be updated

    //form data
    const [currentMessage, setCurrentMessage] = useState(''); //updates when user inputs something into chatbox
    const [inviteUsername, setInviteUsername] = useState(''); //updates when user selects person to invite from dropdown
    const { username } = useParams();
    
    const navigate = useNavigate(); 
    const home = () => {
        navigate("/" + username + "/home");
    };

    const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]); // Specify the type as Invite[]
   
    useEffect(() => {
        // Check if logged in 
        axios.get(`${rootURL}/${username}/isLoggedIn`, { withCredentials: true })
            .then((response) => {
                setIsLoggedIn(response.data.isLoggedIn);
            })
            .catch((error) => {
                console.error('Error checking login status:', error);
            });


        // send username for server upon connection with socket
        socket.emit("send_username", { username: username });
        
        //get notified with a list of connected users upon connection
        socket.on('connected_users', (users: string[]) => {
            setConnectedUsers(users);
        });

        //get notified with list of existing invites to username upon connection
        socket.on('room_invites', async (invites:Invite[]) => {
            setIncomingInvites(invites)
        });
        
        //get notified with with list of chat rooms that user belongs to upon connection
        socket.on('chat_rooms', async (rooms:Room[]) => {
            setRooms(rooms)
            if (rooms.length > 0){
                await setCurrentRoom(rooms[0]) //set current room to first in list
                await getRoomMessages(rooms[0]) //get messages for current room to show on screen
            }
        });
        //get notification that previous invite sent was accepted
        socket.on('invite_accepted', (invite:Invite) => {
            alert(`invite accepted by ${invite.inviteUsername}`)
        });
        
        //get notification that previous invite sent was declined
        socket.on('invite_declined', (invite:Invite) => {
            alert(`invite declined by ${invite.inviteUsername}`)
        });
        

        //get notification new user was connected
        socket.on('user_connected', ({ username }) => {
            setConnectedUsers(prevUsers => {
                if (!prevUsers.includes(username)) {
                    return [...prevUsers, username];
                }
                return prevUsers;
            });
        });

        //force disconnect from server, someone with same username logged on from different socket
        socket.on('force_disconnect', () => {
            console.log("Disconnected from server.");
            setIsLoggedIn(false);  // Set logged in state to false on disconnect
        });
        
        //get nofication that user disconnected and remove from current users
        socket.on('user_disconnected', ({ username }) => {
            console.log("here")
            setConnectedUsers(prevUsers => prevUsers.filter(user => user !== username));
        });

        //get notification that of new chat room or chat room update
        //set current room to the room that was created/updated
        socket.on('chat_room', async (room:Room) => {
            //check if room already exists ie. updated with new user
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
        
        //get notified that socket should join new room ie. invite to chat accepted (sent from socket handler accpet_invite)
        //this sends back to server that socket wants to socket join room
        socket.on('join_room', (room) => {
            socket.emit('join_room', room);
        });
    
        
        return () => {
            socket.off('connected_users');
            socket.off('room_invites');
            socket.off('chat_rooms');
            socket.off('invite_accepted');
            socket.off('invite_declined');
            socket.off('user_connected');
            socket.off('force_disconnect');
            socket.off('user_disconnected');
            socket.off('chat_room');
            socket.off('join_room');
            socket.disconnect()
        };
    }, []);

    useEffect(() => {
        // get notification that user left room, update room information to remove user from room
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



        // get notification that new message was recieved, message={roomID:room.roomID, sender: senderUsername, timestamp: timestamp, message: message }
        socket.on('receive_room_message', async (message) => {
            // check if message is for current room, if so append to messages
            if (message.roomID === currentRoom?.roomID) {
                setMessages(prevMessages => [...prevMessages, message]);
            } else {
                //otherwise, add a notification of message to room by updating room state, this will be shown in list of rooms
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
        
        //get notification of chat_invite (for both new chat and group chat), if invite does not already belong to incoming invites then add to incomingInvites
        socket.on('receive_chat_invite', async (invite:Invite) => {
            console.log("Received chat invite:", invite);
            const existingInviteIndex = incomingInvites.findIndex(existingInvite => 
            (existingInvite.room?.roomID === invite.room?.roomID || existingInvite.room === null) 
            && existingInvite.senderUsername === invite.senderUsername
            );
            if (existingInviteIndex !== -1) {
                console.log("Duplicate invite received.");
            } else {
                await setIncomingInvites(prevInvites => [...prevInvites, invite]);
            }
        });

        //get notification of a list of messages associated with room
        //this gets sent when user calls function getRoomMessages, the server then responds with this notification
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


    //handler for when user clicks button for new room
    //updates current room state and messages shown on screen
    const switchCurrentRoom = async(room:Room) => {
        setRooms(rooms.map(r => {
            if (r.roomID === room.roomID) {
                return { ...r, notification: false, notificationMessage: "" };
            }
            return r;
        }));
        setCurrentRoom(room)
        getRoomMessages(room)
    }
    //send notification to server to send back messages for given room
    //server with check if user associated with socket belongs to room before sending back messages
    const getRoomMessages = async (room: Room) => {
        socket.emit("get_room_messages", {room})
    }
    //handler for when user wants to leave current room
    //sets current room to undefined and notifies server who will perform updates to database and notify other users in room
    const sendLeaveRoom = async() => {
        let room: Room | undefined = undefined;
        setCurrentRoom(room);
        setMessages([]);
        setRooms(rooms.filter(room => room.roomID !== currentRoom?.roomID));
        socket.emit('leave_room', { room: currentRoom, username: username });
    }


    //handler for when user sends message to current room
    //updates current message to be empty again for screen and notifies server who will add to database and notify users in room
    const sendMessage = () => {
        if (currentRoom != null) {
            socket.emit('send_room_message', { room: currentRoom , message: currentMessage, senderUsername: username });
            setCurrentMessage('');
        } else {
            alert("Please join a room first.");
        }
    };

    // handler to send new chat invite
    //check if invitee already is in chat with user, otherwise sends notification to server to send invite to invitee
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

    // handler to send group chat invite to current room
    //check if invitee already belongs to room or if current room is null, otherwise sends notification to server to send invite to invitee
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

    //handler to accept invite 
    //removes existing invites to same room (from other users in room) and sends notification to server to that user accepts invite
    const acceptInvite = (invite: Invite) => {
        console.log("Invite accepted:", invite);
        socket.emit('accept_invite', { invite });
        setIncomingInvites(prevInvites => 
            prevInvites.filter(prevInvite => 
                prevInvite.inviteID !== invite.inviteID
            ).filter(prevInvite => 
               prevInvite.room?.roomID !== invite.room?.roomID
            )
            
            );
        
        };
        //handler to decline invite
        //removes invite from list of incoming invites, send notfication to server that user declined invite
        const declineInvite = (invite: Invite) => {
            console.log("Invite declined:", invite);
            socket.emit('decline_invite', { invite });
            setIncomingInvites(prevInvites => 
                prevInvites.filter(prevInvite => 
                    prevInvite.inviteID !== invite.inviteID
                )
            );
        };
    
    

    // Render UI
    if (!isLoggedIn) {
        return <div>Page can't be accessed. Please log in first.</div>;
    }

    return (
    <div>
        {/* Header */}
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
            Pennstagram - {username} &nbsp;
            <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
            onClick={home}>Home</button>&nbsp;
    
            </div>
        </div>

            {/* Display connected users */}
        <div className="mb-4 mx-auto w-1/2">
            <h2 className="text-lg font-bold mb-2">Connected Users:</h2>
            <ul className="bg-gray-100 rounded-lg p-4">
                {connectedUsers.map((user, index) => (
                    <li key={index} className="py-2 border-b border-gray-200 last:border-b-0">{user}</li>
                ))}
            </ul>
        </div>

        {/* Rooms Displayed as boxes */}
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

           
        {/* Send Invite to ChatChat */}
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

        {/* Display Incoming Invites */}
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
                    
        {/* Chat Box */}
        <div className='w-screen h-screen flex flex-col items-center'>
            {/* Show title for current Room and Users in Room */}
            {currentRoom && currentRoom.users && (
                <div className={'font-bold text-3xl'}>
                    Room ID {currentRoom.roomID}:
                    {currentRoom.users.filter(user => user !== username).join(', ')}
                </div>
            )}
            {/* Leave room Button */}
            {currentRoom !== undefined && (
                    <button onClick={sendLeaveRoom} className="bg-red-500 text-white px-4 py-2 rounded">
                        Leave Current Room
                    </button>
            )}
            {/* Show Messages */}
            <div className='h-[40rem] w-[30rem] bg-slate-100 p-3'>
                {/* List messages */}
                <div className='h-[90%] overflow-scroll'>
                    <div className='space-y-2'>
                        {messages.map((msg, index) => {
                            return (
                                <MessageComponent key={index} sender={msg.sender} message={msg.message} timestamp={msg.timestamp} currentUser={username || ''} />
                            )
                        })}
                    </div>
                </div>
                {/* New message Input Box/Button */}
                <div className='w-full flex space-x-2'>
                    {/* Box to input message */}
                    <input className='w-full outline-none border-none px-3 py-1 rounded-md'
                        placeholder='Ask something!'
                        onChange={e => setCurrentMessage(e.target.value)}
                        value={currentMessage}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                sendMessage();
                                setCurrentMessage('');
                            }}} 
                    />
                    {/* Send message button */}
                    <button className='outline-none px-3 py-1 rounded-md text-bold bg-indigo-600 text-white'
                        onClick={() => { sendMessage(); }}>Send</button>
                </div>
            </div>
        </div>

    </div>
        
    );
};

export default ChatPage;
