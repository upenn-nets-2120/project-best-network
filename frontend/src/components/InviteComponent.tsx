import React from 'react';

interface Invite {
    inviteID: number;
    inviteUsername: string;
    senderUsername: string;
    roomID: string;
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
        <div>
            <h2>New Invite</h2>
            <p>Invite from: {invite.senderUsername}</p>
            <p>Room ID: {invite.roomID}</p>
            <p>Invitee: {invite.inviteUsername}</p>
            {/* Add buttons or other UI elements to accept or decline the invite */}
            <button onClick={handleAccept}>Accept</button>
            <button onClick={handleDecline}>Decline</button>
        </div>
    );
};

export default InviteComponent;
