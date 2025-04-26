
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import RoomList from '@/components/RoomList';
import CreateRoomModal from '@/components/CreateRoomModal';
import { toast } from 'sonner';

const Index = () => {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch guest ID on mount
  useEffect(() => {
    const fetchGuestId = async () => {
      try {
        // Check local storage first
        const storedGuestId = localStorage.getItem('guestId');
        if (storedGuestId) {
          setGuestId(storedGuestId);
          setIsLoading(false);
          return;
        }

        // If not in local storage, fetch from API
        const response = await fetch('/api/guest');
        if (!response.ok) {
          throw new Error(`Failed to fetch guest ID: ${response.status}`);
        }
        
        const data = await response.json();
        setGuestId(data.guestId);
        localStorage.setItem('guestId', data.guestId);
      } catch (error) {
        console.error('Error fetching guest ID:', error);
        toast.error("Failed to connect to server. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuestId();
  }, []);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gomoku-primary mb-4"></div>
        <p className="text-gray-600">Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-100 px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gomoku-primary mb-2">Squat Gomoku</h1>
        <p className="text-xl text-gray-600">Exercise your body while exercising your mind</p>
        <div className="mt-4 text-sm bg-gray-100 inline-block rounded-full px-4 py-1">
          Guest ID: <span className="font-mono font-semibold">{guestId}</span>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-6xl">
        <div className="bg-white shadow-xl rounded-xl p-6 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
            <ul className="text-left max-w-2xl mx-auto space-y-2 mb-6">
              <li className="flex items-start">
                <span className="bg-gomoku-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                <span>Do 3 squats to earn a stone placement</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gomoku-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                <span>Faster squats might earn you bonus stones</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gomoku-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                <span>Place 5 stones in a row (horizontally, vertically, or diagonally) to win</span>
              </li>
            </ul>
            <Button 
              onClick={handleOpenCreateModal}
              size="lg" 
              className="bg-gomoku-primary hover:bg-gomoku-secondary"
            >
              Create a Game Room
            </Button>
          </div>

          <RoomList guestId={guestId} onCreateRoom={handleOpenCreateModal} />
        </div>
      </main>

      <footer className="text-center text-gray-500 py-4 mt-8">
        <p>© 2025 Squat Gomoku - Get fit while playing!</p>
      </footer>

      <CreateRoomModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal} 
        guestId={guestId} 
      />
    </div>
  );
};

export default Index;
