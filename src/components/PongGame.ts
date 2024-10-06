// PongGame.ts

import Phaser from 'phaser';

class PongGame extends Phaser.Scene {
    private leftPaddle!: Phaser.GameObjects.Rectangle;
    private rightPaddle!: Phaser.GameObjects.Rectangle;
    private ball!: Phaser.GameObjects.Arc;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private aiSpeed: number = 1;
    private aiDirection: number = Math.random() < 0.5 ? -1 : 1;
    private aiChangeTimer: number = 0;
    private aiChangeInterval: number = 2000; // Time in milliseconds

    constructor() {
        super({ key: 'PongGame' });
    }

    preload() {
        // No assets to load for this basic game
    }

    create() {
        // Set up paddles
        this.leftPaddle = this.add.rectangle(50, this.scale.height / 2, 20, 100, 0xffffff);
        this.physics.add.existing(this.leftPaddle, true);

        this.rightPaddle = this.add.rectangle(
            this.scale.width - 50,
            this.scale.height / 2,
            20,
            100,
            0xffffff
        );
        this.physics.add.existing(this.rightPaddle, true);

        // Set up the ball
        this.ball = this.add.circle(50, this.scale.height / 2, 10, 0xffffff);
        this.physics.add.existing(this.ball);

        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setCollideWorldBounds(true, 1, 1);
        ballBody.setBounce(1, 1);
        ballBody.setVelocity(100, 100);

        // Enable collision between ball and paddles
        this.physics.add.collider(this.ball, this.leftPaddle);
        this.physics.add.collider(this.ball, this.rightPaddle);

        // Set up keyboard input
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update(time: number, delta: number) {
        // Move left paddle with up and down arrow keys
        if (this.cursors.up.isDown) {
            this.leftPaddle.y -= 5;
            (this.leftPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        } else if (this.cursors.down.isDown) {
            this.leftPaddle.y += 5;
            (this.leftPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        }

        // AI paddle movement
        this.rightPaddle.y += this.aiSpeed * this.aiDirection;
        (this.rightPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        // Update AI change timer
        this.aiChangeTimer += delta;
        if (this.aiChangeTimer >= this.aiChangeInterval) {
            this.aiDirection *= -1; // Reverse direction
            this.aiChangeTimer = 0; // Reset the timer
        }

        // Keep paddles within the game bounds
        this.leftPaddle.y = Phaser.Math.Clamp(
            this.leftPaddle.y,
            this.leftPaddle.height / 2,
            this.scale.height - this.leftPaddle.height / 2
        );
        this.rightPaddle.y = Phaser.Math.Clamp(
            this.rightPaddle.y,
            this.rightPaddle.height / 2,
            this.scale.height - this.rightPaddle.height / 2
        );

        // Update paddle bodies after clamping
        (this.leftPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        (this.rightPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
}

export function initializeGame(containerId: string) {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#000',
        physics: {
            default: 'arcade',
        },
        scene: PongGame,
        parent: containerId, // Render the game into this DOM element
    };

    return new Phaser.Game(config);
}
