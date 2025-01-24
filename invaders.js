//canvas
let boxSize = 32;
let rows = 16;
let columns = 16;

let canvas;
let canvasWidth = boxSize * columns; 
let canvasHeight = boxSize * rows;
let cxt;
let totalInvaderCount = 0;

//gun
 let gun = [
    { x: 224, y: 448},
    { x: 224, y: 480},
    { x: 288, y: 480},
    { x: 288, y: 448} ,
    { x: 262, y: 448},
    { x: 262, y: 432},
    { x: 250, y: 432},
    { x: 250, y: 448},
    { x: 224, y: 448},
 ];

let gunVelocityX = boxSize; //gun moving speed

//invaders
let invadersArray = [];
let invadersX = boxSize;
let invadersY = boxSize;
let invadersWidth = boxSize*2;
let invadersHeight = boxSize;
let invadersShape = [
    { x: 0, y: 0 },     // top-left
    { x: 32, y: 0 },    // top-right
    { x: 32, y: 32 },   // bottom-right
    { x: 0, y: 32 },    // bottom-left
    { x: 0, y: 0 },     // back to start
];
let invadersRows = 2;
let invadersColumns = 3;
let invadersCount = 0; //number of invaders to defeat
let invadersVelocityX = 1; //invaders moving speed

//bullets
let bulletArray = [];
let bulletVelocityY = -10; //bullet moving speed

let score = 0;
let gameOver = false;

window.onload = function() {
    canvas = document.getElementById("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    cxt = canvas.getContext("2d"); 

    // Add battlefield pattern
    const pattern = new Image();
    pattern.src = 'battlefield-pattern.png';  // A subtle dirt/ground texture
    pattern.onload = function() {
        const battlePattern = cxt.createPattern(pattern, 'repeat');
        cxt.fillStyle = battlePattern;
        cxt.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawgun(gun);
    createinvaderss();

    requestAnimationFrame(update);
    document.addEventListener("keydown", movegun);
    document.addEventListener("keyup", shoot);
}

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        gameOverScreen()
        return;
    }

    cxt.clearRect(0, 0, canvas.width, canvas.height);

    //gun
    drawgun(gun); 

    //invaders
    for (let i = 0; i < invadersArray.length; i++) {    
        let invaders = invadersArray[i];
        if (invaders.alive) { 
            invaders.x += invadersVelocityX;

            //if invaders touches the borders
            if (invaders.x + invadersWidth >= canvas.width || invaders.x <= 0) {
                invadersVelocityX *= -1;
                invaders.x += invadersVelocityX*2; 

                //move all invaders up by one row 
                for (let j = 0; j < invadersArray.length; j++) {
                    invadersArray[j].y += invadersHeight;
                }
            }
            drawinvaders(invaders);
             
            if (invaders.y >= gun[5].y) {
                gameOver = true;
            }
        }
    }

    //bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        drawBullet(bullet);  // Replace the old bullet drawing code

        for (let j = 0; j < invadersArray.length; j++) {
            let invaders = invadersArray[j];
            if (!bullet.used && invaders.alive && detectCollision(bullet, invaders)) {
                bullet.used = true;
                invaders.alive = false;
                invadersCount--;
                score += 100;
                totalInvaderCount += 1;
                
                // Add explosion effect
                const particles = createSmokeEffect(invaders.x + invaders.width/2, invaders.y + invaders.height/2);
                drawSmoke(particles);
            }
        }
    }

    //clear bullets
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift(); //removes the first element of the array
    }

    //next level
    if (invadersCount == 0) {
        //increase the number of invaderss in columns and rows by 1
        score += invadersColumns * invadersRows * 100; 
        invadersColumns = Math.min(invadersColumns + 1, columns/2 -2);
        invadersRows = Math.min(invadersRows + 1, rows-4); 
        if (invadersVelocityX > 0) {
            invadersVelocityX += 0.2; //increase the invaders movement speed towards the right
        }
        else {
            invadersVelocityX -= 0.2; //increase the invaders movement speed towards the left
        }
        invadersArray = []; 
        bulletArray = [];   
        createinvaderss();  
    }

    if (totalInvaderCount == rows * columns) {
        // Play victory sound (if you have one)
        // const victorySound = new Audio('victory-horn.mp3');
        // victorySound.play();

        // Show victory screen with celebration effects
        winScreen();
        
        // Stop the game loop
        gameOver = true;
        
        // Add victory message to the game container
        const gameContainer = document.querySelector('.game-container');
        const victoryDiv = document.createElement('div');
        victoryDiv.className = 'victory-message';
        victoryDiv.innerHTML = `
            <h2>Victory for Ethiopia!</h2>
            <p>Your bravery has protected Emperor Tewodros II and defended our homeland!</p>
            <p>Your name will be remembered in Ethiopian history.</p>
            <button onclick="playAgain()" class="victory-button">Play Again</button>
        `;
        gameContainer.appendChild(victoryDiv);
    }
    
    //score
    cxt.fillStyle="white";
    cxt.font="16px courier";
    cxt.fillText(score, 5, 20);

    // Add shield effect around the gun
    drawShieldEffect(gun);
}

function movegun(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft") {
        let minX = Math.min(...gun.map(p => p.x)); // Find the minimum x-coordinate of the gun
        if (minX - gunVelocityX >= 0) { // Check if moving left won't go beyond the left edge of the canvas
            for (let i = 0; i < gun.length; i++) {
                gun[i].x -= gunVelocityX; 
            }
        } 
    } else if (e.code == "ArrowRight") {
        let maxX = Math.max(...gun.map(p => p.x)); // Find the maximum x-coordinate of the gun
        if (maxX + gunVelocityX <= canvasWidth) { // Check if moving right won't go beyond the right edge of the canvas
            for (let i = 0; i < gun.length; i++) {
                gun[i].x += gunVelocityX;
            }
        }
    }
}

 function createinvaderss() {
   // const spaceBetweeninvaderss = 4;
    for (let c = 0; c < invadersColumns; c++) { // c =  0 - 2
        for (let r = 0; r < invadersRows; r++) {  // r = 0 - 1
            let invaders = {
                x : invadersX + c * (invadersWidth),
                y : invadersY + r * invadersHeight,
                width : invadersWidth,
                height : invadersHeight,
                alive : true
            }
            invadersArray.push(invaders);
        }
    }
    invadersCount = invadersArray.length;
}

function shoot(e) {
    if (gameOver) {
        return;
    } 

    if (e.code == "Space") {
        //shoot
        let bullet = {
            x : gun[7].x + 6,
            y : gun[6].y,
            width : boxSize/8,
            height : boxSize/2,
            used : false
        }
        bulletArray.push(bullet); 
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top lef   t corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}
 
 function drawinvaders(invaders) { 
    for (let i = 0; i < invadersShape.length; i++) {
        const p1 = invadersShape[i];
        const p2 = invadersShape[(i + 1) % invadersShape.length];
        drawLine(p1.x + invaders.x, p1.y + invaders.y, p2.x + invaders.x, p2.y + invaders.y, "#FF0000");
    }
}

 function drawgun(gun) {
    for (let i = 0; i < gun.length; i++) {
        const p1 = gun[i];
        const p2 = gun[(i + 1) % gun.length];
        drawLine(p1.x, p1.y, p2.x, p2.y, "#FFD700");
     }
 }

function drawLine(x1, y1, x2, y2, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    const Xinc = dx / steps;
    const Yinc = dy / steps;

    let x = x1;
    let y = y1;

    for (let i = 0; i <= steps; i++) {
        cxt.fillStyle = color;
        cxt.fillRect(x, y, 10, 10); 
        x += Xinc; 
        y += Yinc; 
    }
}

function gameOverScreen() {
    
    cxt.fillStyle = "white";
    cxt.font = "30px  Georgia, 'Times New Roman', Times, serif";
    cxt.fillText("Game Over!", canvasWidth / 2 - 80, canvasHeight / 2);

    cxt.font = "25px  Georgia, 'Times New Roman', Times, serif";

    cxt.fillText("Your Score is: " + score, canvasWidth / 2 - 80, canvasHeight / 2 + 40);
}

function playAgain() {
    location.reload();
}

function winScreen() {
    // Clear the canvas for victory screen
    cxt.fillStyle = "#1a0f0a";
    cxt.fillRect(0, 0, canvasWidth, canvasHeight);

    // Victory Banner
    cxt.fillStyle = "#FFD700";
    cxt.font = "bold 35px Cinzel";
    cxt.textAlign = "center";
    cxt.fillText("GLORIOUS VICTORY!", canvasWidth / 2, canvasHeight / 3);

    // Victory Message
    cxt.fillStyle = "#FFF";
    cxt.font = "20px Cinzel";
    const messages = [
        "Emperor Tewodros II is Safe!",
        "The English Forces Have Been Repelled!",
        "Ethiopia's Honor is Preserved!",
        `Final Score: ${score}`,
        "",
        "Long Live Ethiopia!"
    ];

    // Display victory messages with animation
    messages.forEach((msg, index) => {
        setTimeout(() => {
            cxt.fillText(msg, canvasWidth / 2, canvasHeight / 2 + (index * 30));
        }, index * 1000);
    });

    // Draw celebratory effects
    drawVictoryEffects();
}

function drawVictoryEffects() {
    // Create celebration particles
    const particles = [];
    const colors = ["#FFD700", "#DAA520", "#8B4513", "#FFF"]; // Gold, Golden Brown, Brown, White

    // Animation function for particles
    function animate() {
        if (gameOver) return; // Stop if game is over

        cxt.fillStyle = "rgba(26, 15, 10, 0.1)"; // Slight fade effect
        cxt.fillRect(0, 0, canvasWidth, canvasHeight);

        // Create new particles
        if (particles.length < 100) {
            particles.push({
                x: Math.random() * canvasWidth,
                y: canvasHeight,
                size: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: -Math.random() * 3 - 1,
                speedX: (Math.random() - 0.5) * 2,
                life: 1.0
            });
        }

        // Update and draw particles
        particles.forEach((p, index) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.life -= 0.005;

            if (p.life > 0) {
                cxt.beginPath();
                cxt.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                cxt.fillStyle = p.color;
                cxt.globalAlpha = p.life;
                cxt.fill();
                cxt.globalAlpha = 1;
            } else {
                particles.splice(index, 1);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
}

function drawBullet(bullet) {
    // Bullet trail effect
    cxt.beginPath();
    cxt.moveTo(bullet.x, bullet.y);
    cxt.lineTo(bullet.x, bullet.y + bullet.height);
    cxt.strokeStyle = '#FFA500';
    cxt.lineWidth = 2;
    cxt.stroke();
    
    // Bullet glow effect
    cxt.shadowBlur = 10;
    cxt.shadowColor = '#FFA500';
    cxt.fillStyle = '#FFD700';
    cxt.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    cxt.shadowBlur = 0;
}

function createSmokeEffect(x, y) {
    const particles = [];
    for(let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0
        });
    }
    return particles;
}

function drawSmoke(particles) {
    particles.forEach(particle => {
        if(particle.life > 0) {
            cxt.beginPath();
            cxt.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            cxt.fillStyle = `rgba(100, 100, 100, ${particle.life})`;
            cxt.fill();
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.05;
        }
    });
}

function drawShieldEffect(gun) {
    cxt.beginPath();
    cxt.arc(gun[5].x, gun[5].y, 40, 0, Math.PI * 2);
    cxt.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    cxt.lineWidth = 2;
    cxt.stroke();
}