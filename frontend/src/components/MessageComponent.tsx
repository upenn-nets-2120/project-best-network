import React from 'react';

const MessageComponent = ({ sender, message, timestamp }: { sender: string, message: string, timestamp: number }) => {
    const formattedTimestamp = new Date(timestamp).toLocaleString(); // Convert timestamp to a readable date format

    return (
        <div className={`w-full flex ${sender === 'user' && 'justify-end'}`}>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === 'user' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                <p>{message}</p>
                <span className="text-xs text-gray-500">{formattedTimestamp}</span> {/* Display formatted timestamp */}
            </div>
        </div>
    );
};

export default MessageComponent;
