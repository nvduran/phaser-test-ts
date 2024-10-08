// BossFightGame.ts

import Phaser from 'phaser';

class BossFightGame extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private boss!: Phaser.GameObjects.Rectangle;
    private projectile!: Phaser.GameObjects.Arc;
    private keys!: any; // Updated to use WASD keys and Shift
    private projectileLaunched: boolean = false;
    private barrier!: Phaser.GameObjects.Image; // Barrier with rounded corners
    private bossSpeed: number = 50; // pixels per second
    private bossDirection: number = 0; // 1 for down, -1 for up, 0 for stopped
    private bossChangeDirectionTimer: number = 0; // time accumulator
    private bossChangeDirectionInterval: number = 2000; // time in milliseconds
    private bossHealth: number = 20; // Current health
    private bossMaxHealth: number = 20; // Maximum health
    private bossHealthBar!: Phaser.GameObjects.Graphics; // Health bar graphics
    private eventEmitter: Phaser.Events.EventEmitter;

    // New property to track powered-up state
    private isPoweredUp: boolean = false;

    // Updated property for danger circles
    private dangerCircles!: Phaser.Physics.Arcade.Group;

    constructor(eventEmitter: Phaser.Events.EventEmitter) {
        super({ key: 'BossFightGame' });
        this.eventEmitter = eventEmitter;
    }

    preload() {
        // No assets to load for this basic game
    }

    create() {
        // Set up the player character
        this.player = this.add.rectangle(50, this.scale.height / 2, 20, 100, 0xffffff);
        this.physics.add.existing(this.player);

        // Set up the boss character
        this.boss = this.add.rectangle(
            this.scale.width - 50,
            this.scale.height / 2,
            20,
            100,
            0xffffff
        );
        this.physics.add.existing(this.boss);

        // Create the barrier with rounded corners
        this.createBarrier();

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

        // Enable collision between projectile and barrier
        this.physics.add.overlap(
            this.projectile,
            this.barrier,
            this.handleProjectileBarrierCollision,
            undefined,
            this
        );

        // Set up keyboard input for WASD and Shift
        this.keys = this.input.keyboard!.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            space: 'SPACE', // For launching the projectile
            shift: 'SHIFT', // For powering up the projectile
        });

        // Listen for the spacebar to launch the projectile
        this.keys.space.on('down', () => {
            this.projectileLaunched = true;
        });

        // Listen for the Shift key to power up the projectile
        this.keys.shift.on('down', () => {
            if (!this.projectileLaunched) {
                // Only allow powering up before the projectile is launched
                this.isPoweredUp = true;
            }
        });

        // Initialize the boss health bar
        this.bossHealthBar = this.add.graphics();
        this.updateBossHealthBar(); // Draw the initial health bar

        // Initialize the danger circles group as a dynamic group
        this.dangerCircles = this.physics.add.group();

        // Set up collision between the player and danger circles
        this.physics.add.overlap(
            this.player,
            this.dangerCircles,
            this.handlePlayerDangerCircleCollision,
            undefined,
            this
        );

        // Set up a timer to spawn danger circles every 10 seconds
        this.time.addEvent({
            delay: 10000, // 10 seconds
            callback: this.spawnDangerCircle,
            callbackScope: this,
            loop: true,
        });
    }

    private createBarrier() {
        const barrierWidth = 50;
        const barrierHeight = 150;
        const cornerRadius = 20;

        // Position of the barrier relative to the boss
        const barrierOffsetX = -150; // Distance from the boss to the barrier
        const barrierX = this.boss.x + barrierOffsetX;
        const barrierY = this.boss.y;

        // Create a Graphics object to draw the rounded rectangle
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(0, 0, barrierWidth, barrierHeight, cornerRadius);

        // Generate a texture from the graphics
        graphics.generateTexture('barrierTexture', barrierWidth, barrierHeight);

        // Create an image using the generated texture
        this.barrier = this.add.image(barrierX, barrierY, 'barrierTexture');
        this.barrier.setOrigin(0.5, 0.5);

        // Add physics to the barrier
        this.physics.add.existing(this.barrier);
        const barrierBody = this.barrier.body as Phaser.Physics.Arcade.Body;
        barrierBody.setImmovable(true);
        barrierBody.setAllowGravity(false);
    }

    private handleProjectileBossCollision() {
        // Decrease the boss's health
        if (this.isPoweredUp) {
            this.bossHealth -= 2;
        } else {
            this.bossHealth--;
        }

        // Update the health bar
        this.updateBossHealthBar();

        // Reset projectile position
        this.projectile.setPosition(this.player.x, this.player.y);
        const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
        projectileBody.setVelocity(0, 0);
        this.projectileLaunched = false;

        // Reset powered-up state
        this.isPoweredUp = false;

        // Check if the boss is defeated
        if (this.bossHealth <= 0) {
            this.handleBossDefeat();
        }
    }

    private handleBossDefeat() {
        // Pause the game
        this.physics.pause();

        // Optionally, stop the boss movement
        this.bossDirection = 0;

        // Emit the game end event via the event emitter
        this.eventEmitter.emit('gameEnd');
    }

    private updateBossHealthBar() {
        // Clear previous graphics
        this.bossHealthBar.clear();

        // Health bar dimensions and position
        const barWidth = 200;
        const barHeight = 20;
        const x = this.scale.width - barWidth - 10; // 10 pixels from the right edge
        const y = 10; // 10 pixels from the top edge

        // Draw the background bar (gray)
        this.bossHealthBar.fillStyle(0x808080);
        this.bossHealthBar.fillRect(x, y, barWidth, barHeight);

        // Calculate the width of the health bar based on current health
        const healthWidth = (this.bossHealth / this.bossMaxHealth) * barWidth;

        // Draw the health bar (red)
        this.bossHealthBar.fillStyle(0xff0000);
        this.bossHealthBar.fillRect(x, y, healthWidth, barHeight);
    }

    private handleProjectileBarrierCollision() {
        // Reset projectile position
        this.projectile.setPosition(this.player.x, this.player.y);
        const projectileBody = this.projectile.body as Phaser.Physics.Arcade.Body;
        projectileBody.setVelocity(0, 0);
        this.projectileLaunched = false;

        // Reset powered-up state
        this.isPoweredUp = false;
    }

    private spawnDangerCircle() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(50, this.scale.height - 50);
    
        const warningCircle = this.add.circle(x, y, 50, 0x808080);
    
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                warningCircle.destroy();
    
                const dangerCircle = this.add.circle(x, y, 50, 0xff0000);
    
                this.physics.add.existing(dangerCircle);
    
                const body = dangerCircle.body as Phaser.Physics.Arcade.Body;
                const radius = dangerCircle.radius;
    
                // Center the physics body's circle on the game object's position
                body.setCircle(radius); // Offsets are now zero by default
    
                body.setImmovable(true);
                body.setAllowGravity(false);
                body.setVelocity(0, 0);
    
                this.dangerCircles.add(dangerCircle);
    
                this.time.addEvent({
                    delay: 15000,
                    callback: () => {
                        dangerCircle.destroy();
                    },
                    callbackScope: this,
                });
            },
            callbackScope: this,
        });
    }
    
    
    
    

    private handlePlayerDangerCircleCollision() {
        // Pause the game physics
        this.physics.pause();

        // Optionally, display a game over message here

        // Emit the game end event via the event emitter
        this.eventEmitter.emit('gameEnd');
    }

    update(time: number, delta: number) {
        // Move the player with WASD keys
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setVelocity(0);

        if (this.keys.up.isDown) {
            playerBody.setVelocityY(-200);
        } else if (this.keys.down.isDown) {
            playerBody.setVelocityY(200);
        }

        if (this.keys.left.isDown) {
            playerBody.setVelocityX(-200);
        } else if (this.keys.right.isDown) {
            playerBody.setVelocityX(200);
        }

        // Update projectile color based on powered-up state
        if (!this.projectileLaunched) {
            if (this.isPoweredUp) {
                this.projectile.setFillStyle(0xff0000); // Red color
            } else {
                this.projectile.setFillStyle(0xffffff); // White color
            }
        }

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

        // Keep player within the vertical bounds (adjust if your ground is not at the bottom)
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            this.player.height / 2,
            this.scale.height - this.player.height / 2 - 30 // Adjust 30 if necessary
        );

        // Keep player within the horizontal bounds
        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            this.player.width / 2,
            this.scale.width - this.player.width / 2
        );

        // Update the boss movement timer
        this.bossChangeDirectionTimer += delta;

        if (this.bossChangeDirectionTimer >= this.bossChangeDirectionInterval) {
            this.bossChangeDirectionTimer = 0;

            // Randomly decide to move up, down, or stop
            this.bossDirection = Phaser.Math.Between(-1, 1); // -1, 0, or 1

            // Randomize the next interval between 1 and 3 seconds
            this.bossChangeDirectionInterval = Phaser.Math.Between(1000, 3000);
        }

        // Move the boss
        const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
        bossBody.setVelocityY(this.bossDirection * this.bossSpeed);

        // Keep the boss within the game bounds
        this.boss.y = Phaser.Math.Clamp(
            this.boss.y,
            this.boss.height / 2,
            this.scale.height - this.boss.height / 2
        );

        // Update the barrier's position to stay with the boss
        this.updateBarrierPosition();
    }

    private updateBarrierPosition() {
        const barrierOffsetX = -150; // Distance from the boss to the barrier
        const barrierX = this.boss.x + barrierOffsetX;
        const barrierY = this.boss.y;

        this.barrier.setPosition(barrierX, barrierY);
    }
}

export function initializeGame(
    containerId: string,
    eventEmitter: Phaser.Events.EventEmitter
) {
    const bossFightGameScene = new BossFightGame(eventEmitter);

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#000',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 }, // No gravity in this game
            },
        },
        scene: bossFightGameScene,
        parent: containerId, // Render the game into this DOM element
    };

    return new Phaser.Game(config);
}
