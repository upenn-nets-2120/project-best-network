import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import ChatPage from "./pages/ChatPage";
import config from '../config.json';

import { io, Socket } from "socket.io-client";
const socket = io();
socket.emit('join', { name: 'Paola', room: '1' }, () => {});

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<ChatInterface />} />
        <Route path="/chat" element={<ChatPage/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
