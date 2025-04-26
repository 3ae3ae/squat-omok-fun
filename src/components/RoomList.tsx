
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RoomInfo } from '@/hooks/useWebSocket';

interface RoomListProps {
  guestId: string | null;
  onCreateRoom: () => void;
}

const RoomList: React.FC<RoomListProps> = ({ guestId, onCreateRoom }) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch room list
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) {
          throw new Error(`Failed to fetch rooms: ${response.status}`);
        }
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error("Failed to load room list. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
    
    // Poll for room updates every 5 seconds
    const intervalId = setInterval(fetchRooms, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Join a room
  const handleJoinRoom = async (roomId: string) => {
    if (!guestId) {
      toast.error("Guest ID not available. Please refresh the page.");
      return;
    }
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guestId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join room: ${response.status}`);
      }
      
      const data = await response.json();
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gomoku-primary">Available Rooms</h2>
        <Button onClick={onCreateRoom} className="bg-gomoku-primary hover:bg-gomoku-secondary">
          Create Room
        </Button>
      </div>
      
      <Separator className="mb-6" />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gomoku-primary"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No rooms available</p>
          <Button onClick={onCreateRoom} variant="outline">Create a New Room</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <Card key={room.roomId} className="overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{room.roomName}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Players: {room.playerCount}/2
                </p>
                <Button 
                  onClick={() => handleJoinRoom(room.roomId)}
                  className="w-full bg-gomoku-primary hover:bg-gomoku-secondary"
                  disabled={room.playerCount >= 2}
                >
                  {room.playerCount >= 2 ? 'Room Full' : 'Join Room'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;
