import Phaser from 'phaser';

class PongGame extends Phaser.Scene {
    private leftPaddle!: Phaser.GameObjects.Rectangle;
    private rightPaddle!: Phaser.GameObjects.Rectangle;
    private ball!: Phaser.GameObjects.Arc;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private ballInPlay: boolean = false;

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

        // Set up the ball at the left paddle's position
        this.ball = this.add.circle(this.leftPaddle.x, this.leftPaddle.y, 10, 0xffffff);
        this.physics.add.existing(this.ball);

        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setCollideWorldBounds(false); // Ball won't collide with world bounds
        ballBody.setBounce(0);

        // Enable collision between ball and right paddle
        this.physics.add.overlap(this.ball, this.rightPaddle, this.handleBallRightPaddleCollision, undefined, this);

        // Set up keyboard input
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Listen for the spacebar to launch the ball
        this.input.keyboard!.on('keydown-SPACE', () => {
            this.ballInPlay = true;
        });
    }

    private handleBallRightPaddleCollision() {
        // Reset ball position
        this.ball.setPosition(this.leftPaddle.x, this.leftPaddle.y);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setVelocity(0, 0);
        this.ballInPlay = false;
    }

    update(time: number, delta: number) {
        // Move left paddle with up and down arrow keys
        if (this.cursors.up.isDown) {
            this.leftPaddle.y -= 5;
        } else if (this.cursors.down.isDown) {
            this.leftPaddle.y += 5;
        }
        // Update left paddle physics body
        (this.leftPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        if (this.ballInPlay) {
            // Ball follows the right paddle like a missile
            const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
            const speed = 200; // Adjust speed as necessary
            const dx = this.rightPaddle.x - this.ball.x;
            const dy = this.rightPaddle.y - this.ball.y;
            const angle = Math.atan2(dy, dx);
            ballBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else {
            // Ball stays attached to the left paddle
            this.ball.setPosition(this.leftPaddle.x, this.leftPaddle.y);
            const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
            ballBody.setVelocity(0, 0);
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

        // Update paddle physics bodies after clamping
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
