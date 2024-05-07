import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

const FriendComponent = ({ name, add = true, remove = true }: { name: string, add: boolean | undefined, remove: boolean | undefined }) => {
    return (
        <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                {name}
            </div>
        </div>
    )
}
export default function Friends() {

    const navigate = useNavigate();
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // TODO: add state variables for friends and recommendations
    interface Friend {
        firstName: string;
        lastName: string;
        username: string;
    }


    const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
    const [offlineFriends, setOfflineFriends] = useState<Friend[]>([]);
    const [recommendations, setRecommendations] = useState<Friend[]>([]);
    const [newFriendName, setNewFriendName] = useState('');
    const [removeFriendName, setRemoveFriendName] = useState('');

    const feed = () => {
        navigate("/" + username + "/home");
    };

    const chat = () => {
        navigate("/" + username + "/chat");
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const onlineFriendsResponse = await axios.get(`${rootURL}/${username}/onlineFriends`, { withCredentials: true });
                setOnlineFriends(onlineFriendsResponse.data.results);

                const offlineFriendsResponse = await axios.get(`${rootURL}/${username}/offlineFriends`, { withCredentials: true });
                setOfflineFriends(offlineFriendsResponse.data.results);

                const recommendationsResponse = await axios.get(`${rootURL}/${username}/recommendedFriends`, { withCredentials: true });
                setRecommendations(recommendationsResponse.data.results);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

    }, []);

    const addFriend = async () => {
        try {
            await axios.post(`${rootURL}/${username}/addFriend`, { username: newFriendName }, { withCredentials: true });
            setNewFriendName('');
            // Refresh friends list after adding
            const onlineFriendsResponse = await axios.get(`${rootURL}/${username}/onlineFriends`, { withCredentials: true });
            setOnlineFriends(onlineFriendsResponse.data.results);

            const offlineFriendsResponse = await axios.get(`${rootURL}/${username}/offlineFriends`, { withCredentials: true });
            setOfflineFriends(offlineFriendsResponse.data.results);

            const recommendationsResponse = await axios.get(`${rootURL}/${username}/recommendedFriends`, { withCredentials: true });
            setRecommendations(recommendationsResponse.data.results);
        } catch (error) {
            alert("Error adding friend :(");

            console.error('Error adding friend:', error);
        }
    };

    const removeFriend = async () => {
        try {

            await axios.post(`${rootURL}/${username}/removeFriend`, {
                username: removeFriendName
              }, { withCredentials: true });
            setRemoveFriendName('');
            // Refresh friends list after removing
            const onlineFriendsResponse = await axios.get(`${rootURL}/${username}/onlineFriends`, { withCredentials: true });
            setOnlineFriends(onlineFriendsResponse.data.results);

            const offlineFriendsResponse = await axios.get(`${rootURL}/${username}/offlineFriends`, { withCredentials: true });
            setOfflineFriends(offlineFriendsResponse.data.results);

            const recommendationsResponse = await axios.get(`${rootURL}/${username}/recommendedFriends`, { withCredentials: true });
            setRecommendations(recommendationsResponse.data.results);
        
        } catch (error) {
            alert("Error removing friend :(");
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div>
            <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
                <div className='text-2xl max-w-[1800px] w-full flex items-center'>
                    Pennstagram - {username} &nbsp;
                    <button 
                        type="button" 
                        className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                        onClick={() => navigate(`/${username}/home`)}
                    >
                        Home
                    </button>
                    <div style={{ width: '5px' }} />
                    <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                        onClick={feed}>Feed</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                    onClick={chat}>Chat</button>
                </div>
            </div>
            <div className='h-full w-full mx-auto max-w-[1800px] flex space-x-4 p-3'>
                <div className='font-bold text-2xl'>
                    <div>
                        <input type="text" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} placeholder="Enter friend's name" />
                        <button type="button" onClick={addFriend}>Add Friend</button>
                    </div>
                    <div>
                        <input type="text" value={removeFriendName} onChange={(e) => setRemoveFriendName(e.target.value)} placeholder="Enter friend's name to remove" />
                        <button type="button" onClick={removeFriend}>Remove Friend</button>
                    </div>
                </div>
                <div className='font-bold text-2xl'>
                    {`${username}'s friends currently online`}
                    {onlineFriends && onlineFriends.length > 0 ? (
                        <div className='space-y-2'>
                            {onlineFriends.map((friend, index) => (
                                <FriendComponent key={index} name={friend.username} add={true} remove={true} />
                            ))}
                        </div>
                    ) : (
                        <div>No online friends</div>
                    )}
                </div>

                <div className='font-bold text-2xl'>
                    {`${username}'s friends currently offline`}
                    {offlineFriends && offlineFriends.length > 0 ? (
                        <div className='space-y-2'>
                            {offlineFriends.map((friend, index) => (
                                <FriendComponent key={index} name={friend.username} add={true} remove={true} />
                            ))}
                        </div>
                    ) : (
                        <div>No offline friends</div>
                    )}
                </div>

                <div className='font-bold text-2xl'>
                    {`${username}'s recommended friends`}
                    {recommendations && recommendations.length > 0 ? (
                        <div className='space-y-2'>
                            {recommendations.map((friend, index) => (
                                <FriendComponent key={index} name={friend.username} add={true} remove={true} />
                            ))}
                        </div>
                    ) : (
                        <div>No recommended friends</div>
                    )}
                </div>
            </div>
        </div>
    )
}
