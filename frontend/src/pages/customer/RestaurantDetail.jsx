import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore, useQueueStore } from '../../store/store';
import { Clock, Users } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [groupSize, setGroupSize] = useState(1);
  const user = useAuthStore(state => state.user);
  const setMyToken = useQueueStore(state => state.setMyToken);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/restaurants/${id}`);
        setRestaurant(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRes();
  }, [id]);

  const handleJoinQueue = async () => {
    if (!user) {
      alert("Please login first");
      navigate('/login');
      return;
    }
    
    try {
      const res = await axios.post(`http://localhost:8000/api/queue/join`, {
        restaurant_id: id,
        user_id: user._id,
        group_size: groupSize
      });
      setMyToken(res.data);
      navigate('/tracking');
    } catch (e) {
      alert("Failed to join queue");
    }
  };

  if (!restaurant) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <img 
        src={restaurant.images[0] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"} 
        alt={restaurant.name} 
        style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }}
      />
      
      <div className="card mt-6">
        <h1 className="text-2xl font-bold text-primary">{restaurant.name}</h1>
        <p className="text-secondary mt-1">{restaurant.location}</p>
        
        <div className="flex gap-4 mt-4 mb-6">
          <div className="flex items-center text-warning bg-warning bg-opacity-10 px-3 py-1 rounded-full">
            <Clock size={16} className="mr-2"/> ~15 min wait
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Join Queue</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="input-label">Group Size</label>
              <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
                <Users size={20} className="text-secondary mr-2"/>
                <input 
                  type="number" 
                  min="1" max="20"
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  style={{ border: 'none', outline: 'none', width: '100%' }}
                />
              </div>
            </div>
            <div className="flex-1 flex items-end">
              <button onClick={handleJoinQueue} className="btn btn-primary w-full" style={{ height: '46px' }}>
                Get Token
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
