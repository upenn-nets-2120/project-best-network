import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import config from '../../config.json';
const rootURL = config.serverRootURL;
const socket = io(rootURL+"/chat");
console.log(rootURL+"/chat")
socket.emit('join', { name: 'Paola', room: '1' }, () => {});

const ChatPage = () => {
    // State to store the messages
    const [messages, setMessages] = useState<string[]>([]);
    // State to store the current message
    const [currentMessage, setCurrentMessage] = useState('');

    useEffect(() => {
        // Create a socket connection

        // Listen for incoming messages
        socket.on('message', (message) => {
          console.log(message)
          setMessages(prevMessages => [...prevMessages, message]);
          return
      });

        // Clean up the socket connection on unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    const sendMessage = () => {
        // Send the message to the server
        socket.emit('message', currentMessage);
        // Clear the currentMessage state
        setCurrentMessage('');
    };

    return (
        <div>
            {/* Display the messages */}
            {messages.map((message, index) => (
                <p key={index}>{message}</p>
            ))}

            {/* Input field for sending new messages */}
            <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
            />
      
            {/* Button to submit the new message */}
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatPage;