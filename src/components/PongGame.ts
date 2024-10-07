import Phaser from 'phaser';

class PongGame extends Phaser.Scene {
    private leftPaddle!: Phaser.GameObjects.Rectangle;
    private rightPaddle!: Phaser.GameObjects.Rectangle;
    private ball!: Phaser.GameObjects.Arc;
    private keys!: any; // Updated to use WASD keys
    private ballInPlay: boolean = false;
    private rightPaddleHitCount: number = 0; // Counter variable
    private hitCountText!: Phaser.GameObjects.Text; // Text object to display the counter

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
        this.physics.add.overlap(
            this.ball,
            this.rightPaddle,
            this.handleBallRightPaddleCollision,
            undefined,
            this
        );

        // Set up keyboard input for WASD
        this.keys = this.input.keyboard!.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            space: 'SPACE' // For launching the ball
        });

        // Listen for the spacebar to launch the ball
        this.keys.space.on('down', () => {
            this.ballInPlay = true;
        });

        // Create a text object to display the hit count
        this.hitCountText = this.add.text(10, 10, 'Hits: 0', {
            fontSize: '20px',
            color: '#ffffff',
        });
    }

    private handleBallRightPaddleCollision() {
        // Increment the counter
        this.rightPaddleHitCount++;
        // Update the displayed text
        this.hitCountText.setText('Hits: ' + this.rightPaddleHitCount);

        // Reset ball position
        this.ball.setPosition(this.leftPaddle.x, this.leftPaddle.y);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setVelocity(0, 0);
        this.ballInPlay = false;
    }

    update(time: number, delta: number) {
        // Move left paddle with WASD keys
        if (this.keys.up.isDown) {
            this.leftPaddle.y -= 3;
        } else if (this.keys.down.isDown) {
            this.leftPaddle.y += 3;
        }

        if (this.keys.left.isDown) {
            this.leftPaddle.x -= 3;
        } else if (this.keys.right.isDown) {
            this.leftPaddle.x += 3;
        }

        // Update left paddle physics body
        (this.leftPaddle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        if (this.ballInPlay) {
            // Ball follows the right paddle like a missile
            const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
            const speed = 600; // Adjust speed as necessary
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

        this.leftPaddle.x = Phaser.Math.Clamp(
            this.leftPaddle.x,
            this.leftPaddle.width / 2,
            this.scale.width - this.leftPaddle.width / 2
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
