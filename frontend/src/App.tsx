import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import ChatPage from "./pages/ChatPage";
import ProfilePage from './pages/ProfilePage'; 
import ProfilePhoto from './pages/ProfilePhoto'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat_nlp" element={<ChatInterface />} />
        <Route path="/:username/chat" element={<ChatPage />} />
        <Route path="/:username/setProfilePhoto" element={<ProfilePhoto />} />
        <Route path="/:username/ProfilePage" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
