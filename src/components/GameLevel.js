import "./style.css";
import Phaser, { Physics } from "phaser";

const sizes = {
        width: 500,
        height: 500,
};

const speedDown = 100;

const gameStartDiv = document.getElementById("gameStartDiv");
const gameStartBtn = document.getElementById("gameStartBtn");
const gameEndDiv = document.getElementById("gameEndDiv");
const gameWinLoseSpan = document.getElementById("gameWinLoseSpan");
const gameEndScoreSpan = document.getElementById("gameScoreSpan");

class GameScene extends Phaser.Scene {
        constructor() {
                super("scene-game");
                this.player;
                this.cursor;
                this.playerSpeed = speedDown + 50;
                this.target;
                this.points = 0;
                this.textScore;
                this.textTime;
                this.timedEvent;
                this.remainingTime = 60;
                this.coinMusic;
                this.backgroundMusic;
                this.emitter;
        }

        preload() {
                this.load.image("bg", "assets/bg.png");
                this.load.image("basket", "assets/basket.png");
                this.load.image("apple", "assets/apple.png");
                this.load.audio("bgMusic", "assets/bgMusic.mp3");
                this.load.audio("coin", "assets/coin.mp3");
        }

        create() {
                this.scene.pause("scene-game");

                this.backgroundMusic = this.sound.add("bgMusic");
                this.coinMusic = this.sound.add("coin");
                // this.backgroundMusic.play();

                this.add.image(0, 0, "bg").setOrigin(0, 0);
                //added physics to the player
                this.player = this.physics.add.image(0, sizes.height - 100, "basket").setOrigin(0, 0);
                this.player.setImmovable(true);
                this.player.body.allowGravity = false;
                this.player.setSize(80, 15).setOffset(10, 40);

                this.cursor = this.input.keyboard.createCursorKeys();
                this.player.setCollideWorldBounds(true);

                this.target = this.physics.add.image(0, 0, "apple").setOrigin(0, 0);
                this.target.setMaxVelocity(0, speedDown);

                this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);

                this.textScore = this.add.text(10, 10, `Score: ${this.points}`, {
                        fontSize: "24px Arial",
                        fill: "#000",
                });

                this.textTime = this.add.text(sizes.width - 100, 10, `Time: 0`, {
                        fontSize: "24px Arial",
                        fill: "#000",
                });

                this.timedEvent = this.time.delayedCall(3000, this.gameOver, [], this);

                this.emitter = this.add.particles(0, 0, "money", {
                        speed: 100,
                        gravityY: speedDown - 200,
                        scale: 0.04,
                        duration: 100,
                        emitting: false,
                });
                this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2);
        }

        update() {
                this.remainingTime = this.timedEvent.getRemainingSeconds();
                this.textTime.setText(`Time: ${this.remainingTime.toFixed(0)}`);

                if (this.target.y > sizes.height) {
                        this.target.setY(0);
                        this.target.setX(Math.random() * sizes.width - 20);
                }

                const { left, right } = this.cursor;

                if (left.isDown) {
                        this.player.setVelocityX(-this.playerSpeed);
                } else if (right.isDown) {
                        this.player.setVelocityX(this.playerSpeed);
                }
        }

        targetHit() {
                // this.coinMusic.play();
                this.emitter.start();
                this.target.setY(0);
                this.target.setX(Math.random() * sizes.width - 20);
                this.points++;
                this.textScore.setText(`Score: ${this.points}`);
        }

        gameOver() {
                console.log("Game Over");
        }
}

const config = {
        type: Phaser.WEBGL,
        width: sizes.width,
        height: sizes.height,
        canvas: document.getElementById("gameCanvas"),
        physics: {
                default: "arcade",
                arcade: {
                        gravity: { y: speedDown },
                        debug: false,
                },
        },
        scene: [GameScene],
};

const game = new Phaser.Game(config);

gameStartBtn.addEventListener("click", () => {
        gameStartDiv.style.display = "none";
        gameEndDiv.style.display = "none";
        game.scene.resume("scene-game");
});
