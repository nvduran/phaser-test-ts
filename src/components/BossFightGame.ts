import Phaser from 'phaser';

class BossFightGame extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private boss!: Phaser.GameObjects.Rectangle;
    private projectile!: Phaser.GameObjects.Arc;
    private keys!: any; // Updated to use WASD keys
    private projectileLaunched: boolean = false;
    private bossHitCount: number = 0; // Counter variable
    private hitCountText!: Phaser.GameObjects.Text; // Text object to display the counter

    constructor() {
        super({ key: 'BossFightGame' });
    }

    preload() {
        // No assets to load for this basic game
    }

    create() {
        // Set up the player character
        this.player = this.add.rectangle(50, this.scale.height / 2, 20, 100, 0xffffff);
        this.physics.add.existing(this.player, true);

        // Set up the boss character
        this.boss = this.add.rectangle(
            this.scale.width - 50,
            this.scale.height / 2,
            20,
            100,
            0xffffff
        );
        this.physics.add.existing(this.boss, true);

        // Set up the projectile at the player's position
        this.projectile = this.add.circle(this.player.x, this.player.y, 10, 0xffffff);
        this.physics.add.existing(this.projectile);

        const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
        projectileBody.setCollideWorldBounds(false); // Projectile won't collide with world bounds
        projectileBody.setBounce(0);

        // Enable collision between projectile and boss
        this.physics.add.overlap(
            this.projectile,
            this.boss,
            this.handleProjectileBossCollision,
            undefined,
            this
        );

        // Set up keyboard input for WASD
        this.keys = this.input.keyboard!.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            space: 'SPACE' // For launching the projectile
        });

        // Listen for the spacebar to launch the projectile
        this.keys.space.on('down', () => {
            this.projectileLaunched = true;
        });

        // Create a text object to display the hit count
        this.hitCountText = this.add.text(10, 10, 'Hits: 0', {
            fontSize: '20px',
            color: '#ffffff',
        });
    }

    private handleProjectileBossCollision() {
        // Increment the counter
        this.bossHitCount++;
        // Update the displayed text
        this.hitCountText.setText('Hits: ' + this.bossHitCount);

        // Reset projectile position
        this.projectile.setPosition(this.player.x, this.player.y);
        const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
        projectileBody.setVelocity(0, 0);
        this.projectileLaunched = false;
    }

    update() {
        // Move the player with WASD keys
        if (this.keys.up.isDown) {
            this.player.y -= 3;
        } else if (this.keys.down.isDown) {
            this.player.y += 3;
        }

        if (this.keys.left.isDown) {
            this.player.x -= 3;
        } else if (this.keys.right.isDown) {
            this.player.x += 3;
        }

        // Update player physics body
        (this.player.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        if (this.projectileLaunched) {
            // Projectile follows the boss like a homing missile
            const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
            const speed = 600; // Adjust speed as necessary
            const dx = this.boss.x - this.projectile.x;
            const dy = this.boss.y - this.projectile.y;
            const angle = Math.atan2(dy, dx);
            projectileBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else {
            // Projectile stays attached to the player
            this.projectile.setPosition(this.player.x, this.player.y);
            const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
            projectileBody.setVelocity(0, 0);
        }

        // Keep player within the game bounds
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            this.player.height / 2,
            this.scale.height - this.player.height / 2
        );

        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            this.player.width / 2,
            this.scale.width - this.player.width / 2
        );

        this.boss.y = Phaser.Math.Clamp(
            this.boss.y,
            this.boss.height / 2,
            this.scale.height - this.boss.height / 2
        );

        // Update physics bodies after clamping
        (this.player.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        (this.boss.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
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
        scene: BossFightGame,
        parent: containerId, // Render the game into this DOM element
    };

    return new Phaser.Game(config);
}
