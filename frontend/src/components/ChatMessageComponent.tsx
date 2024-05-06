import React from 'react';


//this creates chat box for each chat message
const MessageComponent = ({ sender, message, timestamp, currentUser }: { sender: string, message: string, timestamp: number, currentUser: string }) => {
  const formattedTimestamp = new Date(timestamp).toLocaleString(); // Convert timestamp to a readable date format
  const isSenderCurrentUser = sender !== currentUser;

  return (
    <div>
    {isSenderCurrentUser && <p className="text-sm text-gray-600">{sender}</p>}
    <div className={`w-full flex ${!isSenderCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${isSenderCurrentUser ? 'bg-blue-100' : 'bg-slate-200'}`}>
        <p>{message}</p>
        <span className="text-xs text-gray-500">{formattedTimestamp}</span> {/* Display formatted timestamp */}
      </div>
    </div>
    </div>
  );
};

export default MessageComponent;