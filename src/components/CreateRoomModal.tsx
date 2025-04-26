import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/components/ui/BaseComponents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string | null;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, guestId }) => {
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestId) {
      toast.error("Guest ID not available. Please refresh the page.");
      return;
    }
    
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomName: roomName.trim() })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.status}`);
      }
      
      const data = await response.json();
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-gomoku-primary">Create a New Room</DialogTitle>
          <DialogDescription>
            Enter a name for your Squat Gomoku game room.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateRoom} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              disabled={isCreating}
              autoComplete="off"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gomoku-primary hover:bg-gomoku-secondary"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Creating...
                </span>
              ) : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomModal;
