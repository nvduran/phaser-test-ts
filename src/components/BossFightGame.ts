// BossFightGame.ts

import Phaser from 'phaser';

class BossFightGame extends Phaser.Scene {
    private player!: Phaser.GameObjects.Image;
    private boss!: Phaser.GameObjects.Rectangle;
    private keys!: any; // Updated to use WASD keys and Shift
    private barrier: Phaser.GameObjects.Image | null = null; // Barrier with rounded corners
    private bossSpeed: number = 50; // pixels per second
    private bossDirection: number = 0; // 1 for down, -1 for up, 0 for stopped
    private bossChangeDirectionTimer: number = 0; // time accumulator
    private bossChangeDirectionInterval: number = 2000; // time in milliseconds
    private bossHealth: number = 100; // Current health
    private bossMaxHealth: number = 100; // Maximum health
    private bossHealthBar!: Phaser.GameObjects.Graphics; // Health bar graphics
    private eventEmitter: Phaser.Events.EventEmitter;
    private isPoweredUp: boolean = false; // Track powered-up state
    private dangerCircles!: Phaser.Physics.Arcade.Group; // Danger circles group
    private projectileCooldown: number = 0; // Cooldown timer in milliseconds
    private projectileCooldownBar!: Phaser.GameObjects.Graphics; // Cooldown bar graphics
    private projectiles!: Phaser.Physics.Arcade.Group; // Group to manage multiple projectiles
    private isBossDefeated: boolean = false; // Flag to track if the boss is defeated
    private dangerCircleSize: number = 50; // Default danger circle size
    private playerProjectile1Cooldown: number = 1000; // Default cooldown for player projectile 1
    private dangerCircleSpawnInterval: number = 5000; // Default spawn interval for danger circles
    private dangerCircleDespawnInterval: number = 5000; // Default despawn interval for danger circles
    private dangerCircleWarningTime: number = 1000; // Default warning time for danger circles
    private bossShieldEnabled: boolean = true; // New property to track shield state

    constructor(eventEmitter: Phaser.Events.EventEmitter) {
        super({ key: 'BossFightGame' });
        this.eventEmitter = eventEmitter;

        // Listen for updates to the danger circle size
        this.eventEmitter.on('updateDangerCircleSize', (size: number) => {
            this.dangerCircleSize = size;
        });

        // Listen for updates to the player projectile 1 cooldown
        this.eventEmitter.on('updatePlayerProjectile1Cooldown', (cooldown: number) => {
            this.playerProjectile1Cooldown = cooldown;
        });

        // Listen for updates to the danger circle spawn interval
        this.eventEmitter.on('updateDangerCircleSpawnInterval', (interval: number) => {
            this.dangerCircleSpawnInterval = interval;
        });

        // Listen for updates to the danger circle despawn interval
        this.eventEmitter.on('updateDangerCircleDespawnInterval', (interval: number) => {
            this.dangerCircleDespawnInterval = interval;
        });

        // Listen for updates to the danger circle warning time
        this.eventEmitter.on('updateDangerCircleWarningTime', (time: number) => {
            this.dangerCircleWarningTime = time;
        });

        // Listen for updates to the boss max health
        this.eventEmitter.on('updateBossMaxHealth', (health: number) => {
            this.bossMaxHealth = health;
            this.bossHealth = health; // Reset current health to max health
        });

        // Listen for updates to the boss shield enabled state
        this.eventEmitter.on('updateBossShieldEnabled', (enabled: boolean) => {
            this.bossShieldEnabled = enabled;
        });
    }

    preload() {
        // No assets to load for this basic game
    }

    create() {
        // Remove all existing time events
        this.time.removeAllEvents();
    
        // Reset properties
        this.isPoweredUp = false;
        this.bossDirection = 0;
        this.bossChangeDirectionTimer = 0;
        this.bossChangeDirectionInterval = 2000;
        this.bossHealth = this.bossMaxHealth;
        this.projectileCooldown = 0;
        this.isBossDefeated = false;
    
        // Set up the player character as a circle with gradient fill
        const diameter = 50; // Adjust the size as needed
        const x = 50;
        const y = this.scale.height / 2;
    
        // Create an off-screen canvas for the gradient texture
        const gradientTexture = this.textures.createCanvas('gradientCircle', diameter, diameter);
    
        // Get the canvas context
        const ctx = gradientTexture!.getContext();
    
        // Create a radial gradient
        const gradient = ctx.createRadialGradient(
            diameter / 2, diameter / 2, 0,
            diameter / 2, diameter / 2, diameter / 2
        );
    
        // Define the gradient colors
        gradient.addColorStop(0, '#FF0000'); // Center color (red)
        gradient.addColorStop(1, '#0000FF'); // Edge color (blue)
    
        // Fill the circle with the gradient
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, 2 * Math.PI);
        ctx.fill();
    
        // Finalize the texture
        gradientTexture!.refresh();
    
        // Create the player image using the gradient texture
        this.player = this.add.image(x, y, 'gradientCircle');
        this.player.setOrigin(0.5, 0.5);
    
        // Add physics to the player
        this.physics.add.existing(this.player);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setCircle(diameter / 2);
    
        // Adjust the physics body's offset to align correctly
        playerBody.setOffset(-diameter / 2, -diameter / 2);
    
        // Set up the boss character
        this.boss = this.add.rectangle(
            this.scale.width - 50,
            this.scale.height / 2,
            20,
            100,
            0xffffff
        );
        this.physics.add.existing(this.boss);
    
        // Create the barrier with rounded corners if enabled
        if (this.bossShieldEnabled) {
            this.createBarrier();
        }
    
        // Initialize the projectiles group
        this.projectiles = this.physics.add.group();
    
        // Enable collision between projectiles and boss
        this.physics.add.overlap(
            this.projectiles,
            this.boss,
            this.handleProjectileBossCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
    
        // Enable collision between projectiles and barrier if it exists
        if (this.barrier) {
            this.physics.add.overlap(
                this.projectiles,
                this.barrier,
                this.handleProjectileBarrierCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                undefined,
                this
            );
        }
    
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
            if (this.projectileCooldown <= 0) {
                this.fireProjectile();
                this.projectileCooldown = this.playerProjectile1Cooldown; // Cooldown based on settings
            }
        });
    
        // Listen for the Shift key to power up the projectile
        this.keys.shift.on('down', () => {
            this.isPoweredUp = true;
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
            this.handlePlayerDangerCircleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
    
        // Set up a timer to spawn danger circles
        this.time.addEvent({
            delay: this.dangerCircleSpawnInterval,
            callback: this.spawnDangerCircle,
            callbackScope: this,
            loop: true,
        });
    
        // Initialize the projectile cooldown bar
        this.projectileCooldownBar = this.add.graphics();
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

    private handleProjectileBossCollision(
        object1: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        object2: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        let projectile: Phaser.GameObjects.Arc;
        let boss: Phaser.GameObjects.Rectangle;

        if (object1.getData('type') === 'projectile') {
            projectile = object1 as Phaser.GameObjects.Arc;
            boss = object2 as Phaser.GameObjects.Rectangle;
        } else {
            projectile = object2 as Phaser.GameObjects.Arc;
            boss = object1 as Phaser.GameObjects.Rectangle;
        }

        const isPoweredUp = projectile.getData('isPoweredUp') || false;

        if (isPoweredUp) {
            this.bossHealth -= 2;
        } else {
            this.bossHealth--;
        }

        this.updateBossHealthBar();

        projectile.destroy();

        if (this.bossHealth <= 0) {
            this.handleBossDefeat();
        }
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

    private handleProjectileBarrierCollision(
        object1: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        object2: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        let projectile: Phaser.GameObjects.Arc;

        if (object1.getData('type') === 'projectile') {
            projectile = object1 as Phaser.GameObjects.Arc;
        } else {
            projectile = object2 as Phaser.GameObjects.Arc;
        }

        projectile.destroy();
    }

    private spawnDangerCircle() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(50, this.scale.height - 50);
        const radius = this.dangerCircleSize;

        const warningCircle = this.add.circle(x, y, radius, 0x808080);

        this.time.addEvent({
            delay: this.dangerCircleWarningTime,
            callback: () => {
                warningCircle.destroy();

                const dangerCircle = this.add.circle(x, y, radius, 0xff0000);

                this.physics.add.existing(dangerCircle);

                const body = dangerCircle.body as Phaser.Physics.Arcade.Body;

                // Set the physics body's circle with the correct radius
                body.setCircle(radius);
                body.setImmovable(true);
                body.setAllowGravity(false);
                body.setVelocity(0, 0);

                this.dangerCircles.add(dangerCircle);

                this.time.addEvent({
                    delay: this.dangerCircleDespawnInterval,
                    callback: () => {
                        dangerCircle.destroy();
                    },
                    callbackScope: this,
                });
            },
            callbackScope: this,
        });
    }

    private handleBossDefeat() {
        // Pause the game
        this.physics.pause();

        // Stop the boss movement
        this.bossDirection = 0;

        // Remove all time events
        this.time.removeAllEvents();

        // Set the boss defeated flag
        this.isBossDefeated = true;

        // Emit game end event with result 'win'
        this.eventEmitter.emit('gameEnd', { result: 'win' });
    }

    private handlePlayerDangerCircleCollision(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        dangerCircle: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        // Pause the game physics
        this.physics.pause();

        // Remove all time events
        this.time.removeAllEvents();

        // Emit game end event with result 'lose'
        this.eventEmitter.emit('gameEnd', { result: 'lose' });
    }

    private fireProjectile() {
        const projectile = this.add.circle(this.player.x, this.player.y, 10, 0xffffff);
        this.physics.add.existing(projectile);
        const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;
        projectileBody.setCollideWorldBounds(false);
        projectileBody.setBounce(0);

        // Set powered-up state
        if (this.isPoweredUp) {
            projectile.setFillStyle(0xff0000); // Red color
        } else {
            projectile.setFillStyle(0xffffff); // White color
        }
        projectile.setData('isPoweredUp', this.isPoweredUp);
        this.isPoweredUp = false; // Reset powered-up state after firing

        // Projectile follows the boss like a homing missile
        const speed = 600; // Adjust speed as necessary

        // Calculate angle to the boss
        const dx = this.boss.x - projectile.x;
        const dy = this.boss.y - projectile.y;
        const angle = Math.atan2(dy, dx);

        projectileBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // Add to the projectiles group
        this.projectiles.add(projectile);

        // Set data type for collision detection
        projectile.setData('type', 'projectile');
    }

    update(time: number, delta: number) {
        // Early exit if physics are paused
        if (this.physics.world.isPaused) {
            return;
        }

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

        // Update the cooldown timer
        if (this.projectileCooldown > 0) {
            this.projectileCooldown -= delta;
            if (this.projectileCooldown < 0) {
                this.projectileCooldown = 0;
            }
        }

        // Update the cooldown bar
        this.updateCooldownBar();

        // Keep player within the vertical bounds
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

        // Only update boss movement if the boss is not defeated and boss body exists
        if (!this.isBossDefeated && this.boss.body) {
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

            // Update the barrier's position to stay with the boss if it exists
            if (this.bossShieldEnabled && this.barrier) {
                this.updateBarrierPosition();
            }

            // Update projectiles to home in on the boss
            this.projectiles.children.iterate((proj) => {
                const projectile = proj as Phaser.GameObjects.Arc;

                // Check if projectile is active and has a body
                if (!projectile.active || !projectile.body) {
                    return null; // Return null to satisfy the expected return type
                }

                const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;

                // Homing behavior
                const dx = this.boss.x - projectile.x;
                const dy = this.boss.y - projectile.y;
                const angle = Math.atan2(dy, dx);
                const speed = 600;

                projectileBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

                return null; // Return null to satisfy the expected return type
            });
        }
    }

    private updateBarrierPosition() {
        if (this.isBossDefeated || !this.barrier || !this.barrier.body) {
            return; // Early exit if barrier or its body is undefined
        }

        const barrierOffsetX = -150; // Distance from the boss to the barrier
        const barrierX = this.boss.x + barrierOffsetX;
        const barrierY = this.boss.y;

        this.barrier.setPosition(barrierX, barrierY);

        // Update the barrier's physics body position to match the GameObject
        const barrierBody = this.barrier.body as Phaser.Physics.Arcade.Body;
        barrierBody.updateFromGameObject();
    }

    private updateCooldownBar() {
        // Clear previous graphics
        this.projectileCooldownBar.clear();

        // Cooldown bar dimensions and position
        const barWidth = 100;
        const barHeight = 10;
        const x = this.scale.width / 2 - barWidth / 2;
        const y = this.scale.height - barHeight - 10; // 10 pixels from the bottom

        // Draw the background bar (gray)
        this.projectileCooldownBar.fillStyle(0x808080);
        this.projectileCooldownBar.fillRect(x, y, barWidth, barHeight);

        // Calculate the width of the cooldown bar based on remaining cooldown
        const cooldownRatio = this.projectileCooldown / this.playerProjectile1Cooldown;
        const cooldownWidth = barWidth * cooldownRatio;

        // Draw the cooldown bar (red) only if cooldown is active
        if (this.projectileCooldown > 0) {
            this.projectileCooldownBar.fillStyle(0xff0000);
            this.projectileCooldownBar.fillRect(x, y, cooldownWidth, barHeight);
        }
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
