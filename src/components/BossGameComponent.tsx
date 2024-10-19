import React, { useEffect, useRef, useState } from 'react';
import { initializeGame } from './BossFightGame';
import Phaser from 'phaser';

const BossGameComponent: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    const [gameEnded, setGameEnded] = useState(false);
    const [dangerCircleSize, setDangerCircleSize] = useState<number>(50); // Default size
    const [playerProjectile1Cooldown, setPlayerProjectile1Cooldown] = useState(1000);
    const [dangerCircleSpawnInterval, setDangerCircleSpawnInterval] = useState(5000);
    const [dangerCircleDespawnInterval, setDangerCircleDespawnInterval] = useState(5000);
    const [dangerCircleWarningTime, setDangerCircleWarningTime] = useState(1000);
    const [bossMaxHealth, setBossMaxHealth] = useState(100);
    const [bossBarrierHeight, setBossBarrierHeight] = useState(100);

    // Create an event emitter
    const eventEmitter = useRef(new Phaser.Events.EventEmitter()).current;

    useEffect(() => {
        if (gameContainerRef.current) {
            // Initialize the Phaser game and pass the event emitter
            phaserGameRef.current = initializeGame('phaser-game-container', eventEmitter);

            // Listen to the game end event
            eventEmitter.on('gameEnd', () => {
                setGameEnded(true);
            });
        }

        // Clean up the Phaser game instance and event listeners when the component unmounts
        return () => {
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
            eventEmitter.removeAllListeners();
        };
    }, []);

    // Emit the new danger circle size to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateDangerCircleSize', dangerCircleSize);
    }, [dangerCircleSize]);

    // emit the new player projectile cooldown to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updatePlayerProjectile1Cooldown', playerProjectile1Cooldown);
    }, [playerProjectile1Cooldown]);

    // emit the new danger circle spawn interval to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateDangerCircleSpawnInterval', dangerCircleSpawnInterval);
    }, [dangerCircleSpawnInterval]);

    // emit the new danger circle despawn interval to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateDangerCircleDespawnInterval', dangerCircleDespawnInterval);
    }, [dangerCircleDespawnInterval]);

    // emit the new danger circle warning time to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateDangerCircleWarningTime', dangerCircleWarningTime);
    }, [dangerCircleWarningTime]);

    // emit the new boss health to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateBossMaxHealth', bossMaxHealth);
    }, [bossMaxHealth]);

    // emit the new boss barrier height to the game whenever it changes
    useEffect(() => {
        eventEmitter.emit('updateBossBarrierHeight', bossBarrierHeight);
    }, [bossBarrierHeight]);

    const restartGame = () => {
        // Reset the gameEnded state
        setGameEnded(false);

        // Remove previous listeners
        eventEmitter.removeAllListeners('gameEnd');

        // Destroy the existing game instance
        if (phaserGameRef.current) {
            phaserGameRef.current.destroy(true);
            phaserGameRef.current = null;
        }

        // Re-initialize the game
        phaserGameRef.current = initializeGame('phaser-game-container', eventEmitter);

        // Re-attach the event listener
        eventEmitter.on('gameEnd', () => {
            setGameEnded(true);
        });
    };

    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Danger Circle Size:
                    <input
                        type="number"
                        value={dangerCircleSize}
                        onChange={(e) => setDangerCircleSize(Number(e.target.value))}
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Danger Circle Spawn Interval:
                    <input
                        type="number"
                        value={dangerCircleSpawnInterval}
                        onChange={(e) => setDangerCircleSpawnInterval(Number(e.target.value))}
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Danger Circle Despawn Interval:
                    <input
                        type="number"
                        value={dangerCircleDespawnInterval}
                        onChange={(e) => setDangerCircleDespawnInterval(Number(e.target.value))}
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Danger Circle Warning Time:
                    <input
                        type="number"
                        value={dangerCircleWarningTime}
                        onChange={(e) => setDangerCircleWarningTime(Number(e.target.value))}
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Player Projectile 1 Cooldown:
                    <input
                        type="number"
                        value={playerProjectile1Cooldown}
                        onChange={(e) => setPlayerProjectile1Cooldown(Number(e.target.value))}
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
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>
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
                        <h1>You Win!</h1>
                        <button onClick={restartGame}>Restart Game</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BossGameComponent;
