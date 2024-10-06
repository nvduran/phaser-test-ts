// PongGameComponent.tsx

import React, { useEffect, useRef } from 'react';
import { initializeGame } from './PongGame'; // Adjust the import path as necessary

const PongGameComponent: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameContainerRef.current) {
            // Initialize the Phaser game
            phaserGameRef.current = initializeGame('phaser-game-container');
        }

        // Clean up the Phaser game instance when the component unmounts
        return () => {
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
            }
        };
    }, []);

    return (
        <div
            id="phaser-game-container"
            ref={gameContainerRef}
            style={{ width: '800px', height: '600px' }}
        />
    );
};

export default PongGameComponent;
