import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import ChatPage from "./pages/ChatPage";
import config from '../config.json';

// import socketIO from 'socket.io-client';
// const socket = socketIO.connect('http://192.168.3.104:4000');
// interface AppProps {
//   socket: SocketIOClient.Socket;
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<ChatInterface />} />
        {/* <Route path="/chat" element={<ChatPage socket={socket} />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
