import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

const FriendComponent = ({ name, add=true, remove=true }: { name: string, add: boolean|undefined, remove: boolean|undefined}) => {
    return (
        <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                { name }
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
        primaryName: string;
    }
    
    interface Recommendation {
        primaryName: string;
    }
    const [friends, setFriends] = useState<Friend[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);   

    const feed = () => {
        navigate("/"+ username+"/home");
    };

    const chat = () => {
        navigate("/"+ username+"/chat");
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const friendsResponse = await axios.get(`${rootURL}/${username}/friends`, { withCredentials: true });
                setFriends(friendsResponse.data.results);
                
                const recommendationsResponse = await axios.get(`${rootURL}/${username}/recommendations`, { withCredentials: true });
                setRecommendations(recommendationsResponse.data.results);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, []);
    
    return (
        <div>
            <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
                <div className='text-2xl max-w-[1800px] w-full flex items-center'>
                Pennstagram - {username} &nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                onClick={feed}>Feed</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
                onClick={chat}>Chat</button>
                </div>
            </div>
            <div className='h-full w-full mx-auto max-w-[1800px] flex space-x-4 p-3'>
                <div className='font-bold text-2xl'>
                    { `${ username }'s friends` }
                    <div className='space-y-2'>
                        {friends.map((friend, index) => (
                            <FriendComponent key={index} name={friend.primaryName} add={true} remove={true} />
                        ))}
                    </div>
                </div>
                <div className='font-bold text-2xl'>
                    { `${ username }'s recommended friends` }
                    <div className='space-y-2'>
                        {recommendations.map((rec, index) => (
                            <FriendComponent key={index} name={rec.primaryName} add={true} remove={true} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
