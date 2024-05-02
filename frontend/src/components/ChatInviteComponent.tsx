import React from 'react';

interface Invite {
    inviteID: number;
    inviteUsername: string;
    senderUsername: string;
    room: Room;
}

interface Room {
    roomID: number;
    users: string[];
    notification: boolean; 
    notificationMessage: string;
}

interface InviteComponentProps {
    invite: Invite;
    onAccept: (invite: Invite) => void;
    onDecline: (invite: Invite) => void;
}

const InviteComponent: React.FC<InviteComponentProps> = ({ invite, onAccept, onDecline }) => {
    const handleAccept = () => {
        onAccept(invite); // Call onAccept with the invite object
    };

    const handleDecline = () => {
        onDecline(invite); // Call onDecline with the invite object
    };

    return (
        <div className={`w-full flex ${invite.senderUsername === 'user' && 'justify-end'}`}>
        <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${invite.senderUsername === 'user' ? 'bg-blue-100' : 'bg-slate-200'}`}>
            <h2>New Invite</h2>
            <p>Invite from: {invite.senderUsername}</p>
            {invite.room && invite.room.roomID !== null ? (
                <>
                    <p>Room ID: {invite.room.roomID}</p>
                    <ul>
                        {invite.room.users.map((user, index) => (
                            <li key={index}>{user}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <p>Sender: {invite.senderUsername}</p>
            )}
            <p>Invitee: {invite.inviteUsername}</p>
            {/* Add buttons or other UI elements to accept or decline the invite */}
            <button onClick={handleAccept} className="bg-blue-500 text-white px-4 py-2 rounded">Accept</button>
            <button onClick={handleDecline} className="bg-blue-500 text-white px-4 py-2 rounded">Decline</button>
        </div>
        </div>
    
    );
};

export default InviteComponent;
