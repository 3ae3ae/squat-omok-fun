import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import GoBoard, { Stone } from '@/components/GoBoard';
import VideoFeed from '@/components/VideoFeed';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';

interface GameRoomParams {
  [key: string]: string;
  roomId: string;
}

const GameRoom = () => {
  const { roomId } = useParams<keyof GameRoomParams>();
  const navigate = useNavigate();
  const [guestId, setGuestId] = useState<string | null>(localStorage.getItem('guestId'));
  const [isRoomMaster, setIsRoomMaster] = useState(false);
  const [playerColor, setPlayerColor] = useState<'black' | 'white'>('black');
  const [stones, setStones] = useState<Stone[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [canPlaceStone, setCanPlaceStone] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [winner, setWinner] = useState<'black' | 'white' | null>(null);
  const [squats, setSquats] = useState(0);
  const [opponentSquats, setOpponentSquats] = useState(0);
  const [winningStones, setWinningStones] = useState<Stone[]>([]);
  const [opponentPoseData, setOpponentPoseData] = useState<any[]>([]);

  const webSocketUrl = roomId ? `wss://yourserver.com/ws/room/${roomId}` : null;

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'room_joined':
        setIsRoomMaster(message.data.isMaster);
        if (message.data.isMaster) {
          setPlayerColor('black');
        } else {
          setPlayerColor('white');
        }
        break;
      
      case 'game_started':
        setIsGameStarted(true);
        toast.success("Game started! Black stones go first.");
        break;
      
      case 'opponent_place_stone':
        const newStone: Stone = {
          x: message.data.x,
          y: message.data.y,
          color: playerColor === 'black' ? 'white' : 'black'
        };
        setStones(prev => [...prev, newStone]);
        setCurrentTurn(playerColor);
        break;
      
      case 'opponent_pose':
        setOpponentPoseData(message.data);
        break;
      
      case 'opponent_squat':
        setOpponentSquats(prev => prev + 1);
        break;
      
      case 'game_ended':
        setIsGameEnded(true);
        setWinner(message.data.winner);
        if (message.data.winningStones) {
          setWinningStones(message.data.winningStones);
        }
        toast.success(`Game over! ${message.data.winner === playerColor ? 'You won!' : 'Opponent won!'}`);
        break;
      
      case 'opponent_left':
        toast.error("Opponent left the game");
        if (isGameStarted) {
          setWinner(playerColor);
          setIsGameEnded(true);
        }
        break;
    }
  }, [playerColor, roomId]);

  const { sendMessage, isConnected } = useWebSocket(
    webSocketUrl, 
    guestId,
    handleWebSocketMessage
  );

  useEffect(() => {
    if (!guestId) {
      toast.error("Guest ID not found. Redirecting to homepage.");
      navigate('/');
    }
  }, [guestId, navigate]);

  const handleSquatDetected = useCallback(() => {
    sendMessage({
      type: 'my_squat',
      data: {}
    });
    
    setSquats(prev => {
      const newCount = prev + 1;
      
      if (newCount % 3 === 0 && currentTurn === playerColor) {
        setCanPlaceStone(true);
        toast.success("You can now place a stone!");
      }
      
      return newCount;
    });
  }, [sendMessage, currentTurn, playerColor]);

  const handlePlaceStone = useCallback((x: number, y: number) => {
    if (!canPlaceStone || !isGameStarted || isGameEnded) return;
    
    const newStone: Stone = { x, y, color: playerColor };
    setStones(prevStones => [...prevStones, newStone]);
    
    sendMessage({
      type: 'place_stone',
      data: { x, y }
    });
    
    setCurrentTurn(playerColor === 'black' ? 'white' : 'black');
    setCanPlaceStone(false);
  }, [canPlaceStone, isGameStarted, isGameEnded, playerColor, sendMessage]);

  const handlePoseUpdate = useCallback((poseData: any[]) => {
    sendMessage({
      type: 'my_pose',
      data: poseData
    });
  }, [sendMessage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sendMessage({
        type: 'player_leaving',
        data: {}
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendMessage]);

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gomoku-primary">Squat Gomoku</h1>
            <p className="text-gray-600">Room ID: {roomId}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {isGameStarted ? (
              <div className={`px-3 py-1 rounded-full ${currentTurn === playerColor ? 'bg-gomoku-primary text-white' : 'bg-gray-200'}`}>
                {currentTurn === playerColor ? 'Your turn' : 'Opponent\'s turn'}
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                Waiting for game to start...
              </div>
            )}
            
            <div className="px-3 py-1 rounded-full bg-gray-200">
              You: {playerColor === 'black' ? 'Black' : 'White'}
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleLeaveRoom} 
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Leave Room
            </Button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 aspect-square">
            <GoBoard 
              stones={stones}
              currentPlayer={playerColor}
              canPlaceStone={canPlaceStone && currentTurn === playerColor && !isGameEnded}
              onPlaceStone={handlePlaceStone}
              winningStones={winningStones}
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Your Camera</h3>
              <div className="aspect-video">
                <VideoFeed 
                  isLocal={true}
                  onSquatDetected={handleSquatDetected}
                  onPoseUpdate={handlePoseUpdate}
                />
              </div>
              <div className="mt-3 text-center">
                <p>Squats: {squats} (Need {3 - (squats % 3)} more for a stone)</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Opponent</h3>
              <div className="aspect-video">
                <VideoFeed 
                  isLocal={false}
                  squatCount={opponentSquats}
                />
              </div>
              <div className="mt-3 text-center">
                <p>Opponent squats: {opponentSquats}</p>
              </div>
            </div>
          </div>
        </div>
        
        {isGameEnded && (
          <div className={`mt-6 p-4 rounded-lg text-center ${winner === playerColor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h2 className="text-2xl font-bold mb-2">
              {winner === playerColor ? 'You Won!' : 'You Lost!'}
            </h2>
            <Button onClick={handleLeaveRoom}>
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
