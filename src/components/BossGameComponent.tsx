// BossGameComponent.tsx

import React, { useEffect, useRef, useState } from 'react';
import { initializeGame } from './BossFightGame'; // Adjust the import path as necessary
import Phaser from 'phaser';

const BossGameComponent: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    const [gameEnded, setGameEnded] = useState(false);

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
    );
};

export default BossGameComponent;
