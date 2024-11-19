// BossGameComponent.tsx

import React, { useEffect, useRef, useState } from 'react';
import { initializeGame } from './BossFightGame';
import Phaser from 'phaser';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';

interface BossGameProps {
  userData: {
    displayName: string;
    userId: string;
  };
}

const BossGameComponent: React.FC<BossGameProps> = ({ userData }) => {
    console.log(userData);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);

  // Removed state variables for user input
  const [fightName, setFightName] = useState('');
  const [fightId, setFightId] = useState('');

  // Multiplayer state
  const [numPlayers, setNumPlayers] = useState<number>(1);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [otherPlayerConnected, setOtherPlayerConnected] = useState(false);
  const [otherPlayerId, setOtherPlayerId] = useState('');
  const [playerId, setPlayerId] = useState('');

  // Game settings state variables
  const [dangerCircleSize, setDangerCircleSize] = useState<number>(50);
  const [playerProjectile1Cooldown, setPlayerProjectile1Cooldown] = useState(1000);
  const [dangerCircleSpawnInterval, setDangerCircleSpawnInterval] = useState(5000);
  const [dangerCircleDespawnInterval, setDangerCircleDespawnInterval] = useState(5000);
  const [dangerCircleWarningTime, setDangerCircleWarningTime] = useState(1000);
  const [bossMaxHealth, setBossMaxHealth] = useState(100);
  const [bossShieldEnabled, setBossShieldEnabled] = useState(true);

  const eventEmitter = useRef(new Phaser.Events.EventEmitter()).current;

  useEffect(() => {
    if (gameStarted && gameContainerRef.current) {
      phaserGameRef.current = initializeGame(
        'phaser-game-container',
        eventEmitter,
        socket,
        isHost,
        playerId,
        otherPlayerId,
        numPlayers
      );

      // Emit initial settings to the game
      eventEmitter.emit('updateDangerCircleSize', dangerCircleSize);
      eventEmitter.emit('updatePlayerProjectile1Cooldown', playerProjectile1Cooldown);
      eventEmitter.emit('updateDangerCircleSpawnInterval', dangerCircleSpawnInterval);
      eventEmitter.emit('updateDangerCircleDespawnInterval', dangerCircleDespawnInterval);
      eventEmitter.emit('updateDangerCircleWarningTime', dangerCircleWarningTime);
      eventEmitter.emit('updateBossMaxHealth', bossMaxHealth);
      eventEmitter.emit('updateBossShieldEnabled', bossShieldEnabled);

      eventEmitter.on('gameEnd', (data: { result: 'win' | 'lose' }) => {
        setGameEnded(true);
        setGameResult(data.result);
        setGameStarted(false);
      });
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      eventEmitter.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  const startGame = () => {
    console.log(userData.userId, userData.displayName);
    // Prepare the data to send
    const data = {
      danger_circle: {
        size: dangerCircleSize,
        spawn_interval: dangerCircleSpawnInterval,
        despawn_interval: dangerCircleDespawnInterval,
        warning_time: dangerCircleWarningTime,
      },
      boss: {
        health: bossMaxHealth,
        shield: bossShieldEnabled,
      },
      player_projectile_cooldown: playerProjectile1Cooldown,
      submitter: {
        id: userData.userId,
        name: userData.displayName,
      },
      fight_id: fightId,
      fight_name: fightName,
    };

    // Send a POST request to your API endpoint
    axios
      .post('http://localhost:3420/fight-params-raw-submits', data)
      .then((response: any) => {
        console.log('Data posted successfully:', response.data);

        // Generate a unique player ID
        const newPlayerId = userData.userId || `player_${Math.floor(Math.random() * 10000)}`;
        setPlayerId(newPlayerId);

        if (numPlayers === 1) {
          // Single-player mode: Start the game immediately
          setIsHost(true);
          setGameEnded(false);
          setGameStarted(true);
        } else {
          // Multiplayer mode: Connect to the Socket.IO server
          const newSocket = io('http://localhost:3420'); // Adjust the URL as needed
          setSocket(newSocket);

          newSocket.emit('joinGame', { playerId: newPlayerId });

          newSocket.on('gameStart', (data: any) => {
            console.log('Game started:', data);
            console.log('My playerId:', newPlayerId);
            setIsHost(data.isHost);
            setOtherPlayerId(data.otherPlayerId);
            setOtherPlayerConnected(true);
            setGameEnded(false);
            setGameStarted(true);
          });

          // Handle disconnection
          newSocket.on('disconnect', () => {
            setOtherPlayerConnected(false);
          });
        }
      })
      .catch((error: any) => {
        console.error('Error posting data:', error);
        alert('Error starting the game. Please try again.');
      });
  };

  const restartGame = () => {
    // Reset states to show the configuration panel and enable settings adjustment
    setGameEnded(false);
    setGameStarted(false);
    setGameResult(null);
    setIsHost(false);
    setOtherPlayerConnected(false);
    setOtherPlayerId('');
  };

  return (
    <div>
      {!gameStarted && (
        <div>
          {/* Number of Players Selection */}
          <div style={{ marginBottom: '10px' }}>
            <label>
              Number of Players:
              <select
                value={numPlayers}
                onChange={(e) => setNumPlayers(Number(e.target.value))}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              >
                <option value={1}>1 Player</option>
                <option value={2}>2 Players</option>
              </select>
            </label>
          </div>

          {/* Input fields for fight name and fight ID */}
          <div style={{ marginBottom: '10px' }}>
            <label>
              Fight Name:
              <input
                type="text"
                value={fightName}
                onChange={(e) => setFightName(e.target.value)}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Fight ID:
              <input
                type="text"
                value={fightId}
                onChange={(e) => setFightId(e.target.value)}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>

          {/* Existing input fields for game settings */}
          <div style={{ marginBottom: '10px' }}>
            <label>
              Danger Circle Size:
              <input
                type="number"
                value={dangerCircleSize}
                onChange={(e) => setDangerCircleSize(Number(e.target.value))}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Danger Circle Spawn Interval (ms):
              <input
                type="number"
                value={dangerCircleSpawnInterval}
                onChange={(e) =>
                  setDangerCircleSpawnInterval(Number(e.target.value))
                }
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Danger Circle Despawn Interval (ms):
              <input
                type="number"
                value={dangerCircleDespawnInterval}
                onChange={(e) =>
                  setDangerCircleDespawnInterval(Number(e.target.value))
                }
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Danger Circle Warning Time (ms):
              <input
                type="number"
                value={dangerCircleWarningTime}
                onChange={(e) =>
                  setDangerCircleWarningTime(Number(e.target.value))
                }
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Player Projectile Cooldown (ms):
              <input
                type="number"
                value={playerProjectile1Cooldown}
                onChange={(e) =>
                  setPlayerProjectile1Cooldown(Number(e.target.value))
                }
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Boss Health:
              <input
                type="number"
                value={bossMaxHealth}
                onChange={(e) => setBossMaxHealth(Number(e.target.value))}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          {/* Checkbox input for boss shield */}
          <div style={{ marginBottom: '10px' }}>
            <label>
              Enable Boss Shield:
              <input
                type="checkbox"
                checked={bossShieldEnabled}
                onChange={(e) => setBossShieldEnabled(e.target.checked)}
                disabled={gameStarted}
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
          <button onClick={startGame}>Start Game</button>
        </div>
      )}

      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        <div
          id="phaser-game-container"
          ref={gameContainerRef}
          style={{ width: '800px', height: '600px' }}
        />
        {gameEnded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '800px',
              height: '600px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              flexDirection: 'column',
            }}
          >
            <h1>{gameResult === 'win' ? 'You Win!' : 'Game Over'}</h1>
            <button onClick={restartGame}>Restart Game</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossGameComponent;
