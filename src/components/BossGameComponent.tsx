// BossGameComponent.tsx

import React, { useEffect, useRef, useState } from 'react';
import { initializeGame } from './BossFightGame';
import Phaser from 'phaser';

const BossGameComponent: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);

    // Game settings state variables
    const [dangerCircleSize, setDangerCircleSize] = useState<number>(50);
    const [playerProjectile1Cooldown, setPlayerProjectile1Cooldown] = useState(1000);
    const [dangerCircleSpawnInterval, setDangerCircleSpawnInterval] = useState(5000);
    const [dangerCircleDespawnInterval, setDangerCircleDespawnInterval] = useState(5000);
    const [dangerCircleWarningTime, setDangerCircleWarningTime] = useState(1000);
    const [bossMaxHealth, setBossMaxHealth] = useState(100);
    const [bossShieldEnabled, setBossShieldEnabled] = useState(true); // New state variable

    const eventEmitter = useRef(new Phaser.Events.EventEmitter()).current;

    useEffect(() => {
        if (gameStarted && gameContainerRef.current) {
            phaserGameRef.current = initializeGame('phaser-game-container', eventEmitter);

            // Emit initial settings to the game
            eventEmitter.emit('updateDangerCircleSize', dangerCircleSize);
            eventEmitter.emit('updatePlayerProjectile1Cooldown', playerProjectile1Cooldown);
            eventEmitter.emit('updateDangerCircleSpawnInterval', dangerCircleSpawnInterval);
            eventEmitter.emit('updateDangerCircleDespawnInterval', dangerCircleDespawnInterval);
            eventEmitter.emit('updateDangerCircleWarningTime', dangerCircleWarningTime);
            eventEmitter.emit('updateBossMaxHealth', bossMaxHealth);
            eventEmitter.emit('updateBossShieldEnabled', bossShieldEnabled); // Emit the new setting

            eventEmitter.on('gameEnd', (data: { result: 'win' | 'lose' }) => {
                setGameEnded(true);
                setGameResult(data.result);
                setGameStarted(false); // Unlock settings after game ends
            });
        }

        return () => {
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
            eventEmitter.removeAllListeners();
        };
    }, [gameStarted]);

    const startGame = () => {
        setGameEnded(false);
        setGameStarted(true);
    };

    const restartGame = () => {
        // Reset states to show the configuration panel and enable settings adjustment
        setGameEnded(false);
        setGameStarted(false);
        setGameResult(null);
    };

    return (
        <div>
            {!gameStarted && (
                <div>
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
                    {/* New checkbox input for boss shield */}
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
