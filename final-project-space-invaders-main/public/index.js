const canvas = document.getElementById("game-screen")
const ctx = canvas.getContext("2d")
const navbar = document.getElementsByClassName("navbar")[0]

const modalTest = document.getElementById('modal-test-button')
const modal = document.getElementById("game-end-modal")
const modalBackground = document.getElementById('modal-backdrop')
const startModal = document.getElementById('game-start')

const modalStartButton = document.querySelector('.play-button')
const modalPlayAgainButton = document.querySelector('.play-again-button')
const modalSaveScoreButton = document.querySelector('.save-score-button')
const modalCloseButton =  document.querySelector('.modal-close-button')

const modalInput1 = document.getElementById("leaderboard-text-input1")
const modalInput2 = document.getElementById("leaderboard-text-input2")
const modalInput3 = document.getElementById("leaderboard-text-input3")
var timesClicked = 0

const BASESIZE = {w: 300, h: 360}
const shipY = 325
const lineY = 342

const bulletSound = new sound("sounds/shoot.wav")
const deadSound = new sound("sounds/invaderkilled.wav")
const moveSound = new sound("sounds/invadermove.wav")
const playerDeadSound = new sound("sounds/explosion.wav")

function resizeWindow() {
    let xratio = window.innerWidth / BASESIZE.w
    let yratio = (window.innerHeight - navbar.getBoundingClientRect().height - 20) / BASESIZE.h
    let ratio = Math.min(xratio, yratio)
    ratio = Math.floor(ratio)
    if (ratio < 1)
        ratio = 1
    
    canvas.width = BASESIZE.w * ratio
    canvas.height = BASESIZE.h * ratio
    ctx.scale(ratio, ratio)
}

window.addEventListener("resize", resizeWindow())

function clearText() {
    modalInput1.value = ""
    modalInput2.value = ""
    modalInput3.value = ""
}

function loadImage(name) {
    var img = new Image()
    img.src = "images/" + name
    return img
}

function playAgain(event){
    timesClicked = 0
    clearText()
    modal.style.display = "none"
    modalBackground.style.display = "none"
    gameReset()
}

function saveScore(event) {
    if(timesClicked == 0)
    {
        if((modalInput1.value == "") || (modalInput2.value == "") || (modalInput3.value == ""))
        {
            alert("You have not entered a value for some of the initial boxes")
            return
        }
        var settings = {
            "url": "/insert",
            "method": "POST",
            "timeout": 0,
            "headers": {
            "Content-Type": "application/json"
            },
            "data": JSON.stringify({
            "Name": modalInput1.value + modalInput2.value + modalInput3.value,
            "Score": playerScore
            }),
        }
        $.ajax(settings).done(function (response) {
            console.log(response)
        })
        requestScores()
        timesClicked++
        modalSaveScoreButton.textContent = "Go to Leaderboard?"
    }
    else{
        requestScores()
        modalSaveScoreButton.textContent = "Going in 1"
        setTimeout(function(){modalSaveScoreButton.textContent = "Going in 0"},500)
        setTimeout(function(){window.location.replace("/leaderboard")},1000)
    }
}

function requestScores(){
    var settings = {
        "url": "/scores.json",
        "method": "GET",
        "timeout": 0,
        "headers": {
        "Content-Type": "application/json"
        },
    }
    $.ajax(settings).done(function (response) {
        console.log(response)
    })
}

modalCloseButton.addEventListener('click', function(event) {
    clearText()
    modal.style.display = "none"
    modalBackground.style.display = "none"
    playAgain()
})

// Ensures image scaling is not blurry
//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#controlling_image_scaling_behavior
ctx.mozImageSmoothingEnabled = false
ctx.webkitImageSmoothingEnabled = false
ctx.msImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false

var leftPressed = false
var rightPressed = false
var strafeSpeed = 0.1

var alienImages = []

function addAlienImages() {
    alienImages.push(loadImage("alien1.png"))

    for(let i = 0; i < 2; i++) {
        alienImages.push(loadImage("alien2.png"))
    }

    for(let i = 0; i < 2; i++) {
        alienImages.push(loadImage("alien3.png"))
    }

    alienImages.push(loadImage("alien1_2.png"))

    for(let i = 0; i < 2; i++) {
        alienImages.push(loadImage("alien2_2.png"))
    }

    for(let i = 0; i < 2; i++) {
        alienImages.push(loadImage("alien3_2.png"))
    }
}

addAlienImages()

const ufo_im = loadImage("ufo.png")
const floorExplosion = loadImage("impact.png")
const roofExplosion = loadImage("roofExplosion.png")
const bulletIm = loadImage("bullet.png")
const missileIm = loadImage("bullet.png")
const shipIm = loadImage("ship.png")
const b_topcorner = loadImage("b_topcorner.png")
const b_topcornerright = loadImage("b_topcornerright.png")
const b_side = loadImage("b_side.png")
const b_bottom = loadImage("b_bottom.png")
const b_bottomright = loadImage("b_bottomright.png")
const b_core = loadImage("b_core.png")
const explosionIm = loadImage("explosion.png")

function barrier_update(barrier, elapsed, barrier_array, place) {
    erase(barrier, barrier_array, place)
}

function buildBarrierBlock(x, y, image) {
    let block = {x: x, y: y, dead: false, update: barrier_update,
        image: image}
    return block
}

function createBarrier(x, y) {
    arr = []
    arr.push(buildBarrierBlock(x+0, y+0, b_topcorner))
    arr.push(buildBarrierBlock(x+5, y+0, b_core))
    arr.push(buildBarrierBlock(x+11, y+0, b_core))
    arr.push(buildBarrierBlock(x+17, y+0, b_topcornerright))

    arr.push(buildBarrierBlock(x+0, y+4, b_side))
    arr.push(buildBarrierBlock(x+5, y+4, b_core))
    arr.push(buildBarrierBlock(x+11, y+4, b_core))
    arr.push(buildBarrierBlock(x+17, y+4, b_side))

    arr.push(buildBarrierBlock(x+0, y+8, b_side))
    arr.push(buildBarrierBlock(x+5, y+8, b_core))
    arr.push(buildBarrierBlock(x+11, y+8, b_core))
    arr.push(buildBarrierBlock(x+17, y+8, b_side))

    arr.push(buildBarrierBlock(x+0, y+12, b_bottom))
    arr.push(buildBarrierBlock(x+17, y+12, b_bottomright))
    return arr
}

function createBarriers() {
    arr = createBarrier(50, 300)
    arr = arr.concat(createBarrier(110, 300))
    arr = arr.concat(createBarrier(170, 300))
    arr = arr.concat(createBarrier(230, 300))
    return arr
}

var swarmX = -1
var swarmY = 0
var swarmPos = Object()
const swarmSpec = {w: 11, h: 5}
const swarm_x_sep = 20
const swarm_y_sep = 15
var swarmTargetY = 0
var swarmNextX = 0
var swarm_speed = 0.02 //const?
const alienPointValues = [30, 20, 20, 10, 10]
var pointValue = 0
var fireTime = Math.random() * 3000
var swarmSwitchTime = 500
var swarmSwitchImage = false
var speed_multiplier = 1

var alien_speed1 = false
var alien_speed2 = false
var alien_speed3 = false

var levels = 0

var bullets = []
var aliens = spawnAliens(30)
var missiles = [] //alien bullets
var effects = []
var barriers = createBarriers()

var ship = {x: 130, y: shipY, can_fire: true, time_since: 1000, image: shipIm, dead: false, lives: 3, elapsed_score: 0, update: ship_update}
var ships = [ship]

var playerScore = 0
var playerHighScore = 0
var last_score = 0
var displayScore
var displayHighScore = ""

var start
var gameover = false

function gameReset() {
    swarmX = -1
    swarmY = 0
    swarmPos = Object()
    swarmTargetY = 0
    swarmNextX = 0
    pointValue = 0
    fireTime = Math.random() * 3000
    swarmSwitchTime = 500
    swarmSwitchImage = false
    speed_multiplier = 1

    alien_speed1 = false
    alien_speed2 = false
    alien_speed3 = false

    levels = 0

    bullets = []
    aliens = spawnAliens(30)
    missiles = []
    effects = []
    barriers = createBarriers()

    playerScore = 0
    last_score = 0

    ship = {x: 130, y: shipY, can_fire: true, time_since: 1000, image: shipIm, dead: false, lives: 3, elapsed_score: 0, update: ship_update}
    ships = [ship]

    gameover = false
}

function queueGameOver() {
    aliens = []
    ships = []
    ship.dead = true
    gameover = true
    console.log("game over!")

    if(playerScore >= playerHighScore) {
        playerHighScore = playerScore
        scoreDisplayHighScoreZeros()
    }

    modal.style.display = "block"
    modalBackground.display = "block"
}

function spawnAliens(y) {
    swarmPos.x = 30
    swarmPos.y = y
    swarmTargetY = 0
    swarmNextX = 0
    swarmX = -1
    swarmY = 0
    let aliens_arr = []
    for (let i = 0; i < swarmSpec.w; i++) {
        for (let k = 0; k < swarmSpec.h; k++) {
            aliens_arr.push({x: swarmPos.x + i * swarm_x_sep, y: swarmPos.y + k * swarm_y_sep,
                         dead: false, image: alienImages[k], image2: alienImages[5+k],
                         swarm: true, pointValue: alienPointValues[k],
                         update: alien_update})
        }
    }
    return aliens_arr
}

function alien_update(alien, elapsed, alien_array, place) {
    if (alien.swarm) {
        alien.x += swarmX * swarm_speed * elapsed
        alien.y += swarmY * swarm_speed * elapsed
        
        if (swarmSwitchImage) {
            let image1 = alien.image
            alien.image = alien.image2
            alien.image2 = image1
            moveSound.play()
        }
    }
    if(alien.dead) {
        playerScore += alien.pointValue
        effects.push({x: alien.x, y: alien.y, image:explosionIm, update:explosion_update,
                      timer:100})
        alien_array.splice(place, 1)
        deadSound.play()
    }
}

function explosion_update(explosion, elapsed, effects_array, place) {
    explosion.timer -= elapsed
    if (explosion.timer < 0) {
        explosion.dead = true        
    }
    erase(explosion, effects_array, place)
}

function erase(entity, entities, place) {
    if (entity.dead) {
        entities.splice(place, 1)
    }
}

function bullet_update(bullet, elapsed, bullet_array, place) {
    bullet.y -= strafeSpeed * elapsed
    if (bullet.y < 20) {
        bullet.dead = true
        effects.push({x: bullet.x - roofExplosion.naturalWidth/2, y: 20, image:roofExplosion, 
                      update:explosion_update, timer:100})
    }
    erase(bullet, bullet_array, place)
}

function missile_update(missile, elapsed, missile_array, place) {
    missile.y += strafeSpeed * elapsed *0.65
    if (missile.y + missile.image.naturalHeight > lineY) {
        missile.dead = true
        effects.push({x: missile.x - floorExplosion.naturalWidth/2,
                      y: lineY - floorExplosion.naturalHeight,
                      image:floorExplosion, update:explosion_update, timer:100})
    }
    erase(missile, missile_array, place)
}

function ship_update(ship, elapsed, ship_array, place) {
    ship.time_since += elapsed
    if (ship.time_since > 300) {
        ship.can_fire = true
    }

    if (ship.elapsed_score >= 500 && ship.lives < 3){
        ship.lives += 1
        ship.elapsed_score = 0
    }

    if (ship.dead) {
        playerDeadSound.play()
        ship.lives -= 1
        ship.elapsed_score = 0
        ship.dead = false
    }

    if (ship.lives == 0) {
        queueGameOver()
    }
}

function display_entities(entities, elapsed) {
    for (let i = entities.length - 1; i >= 0; i--) {
        ctx.drawImage(entities[i].image, entities[i].x, entities[i].y)
        entities[i].update(entities[i], elapsed, entities, i)
    }
}

function check_collision(entity1, entity2) {
    var rect1 = {x: entity1.x, y: entity1.y, w: entity1.image.naturalWidth, h: entity1.image.naturalHeight}
    var rect2 = {x: entity2.x, y: entity2.y, w: entity2.image.naturalWidth, h: entity2.image.naturalHeight}

    var xcoll = (rect1.x < (rect2.x + rect2.w)) && (rect2.x < (rect1.x + rect1.w))
    var ycoll = (rect1.y < (rect2.y + rect2.h)) && (rect2.y < (rect1.y + rect1.h))
    return xcoll && ycoll
}

function execute_collision(entities1, entities2) {
    for(let i = entities1.length - 1; i >= 0; i--){
        for(let j = entities2.length - 1; j >= 0; j--){
            if (check_collision(entities1[i], entities2[j])) {
                if (!(entities1[i].dead) && !(entities2[j].dead)) {
                    entities1[i].dead = true
                    entities2[j].dead = true
                }
            }
        }
    }
}

function map_swarm(aliens) {
    var minx = 100000000
    var maxx = -10000000
    var miny = 100000000
    var maxy = -10000000

    let aliensByX = {}

    for (var i=0; i < aliens.length; i++) {
        let alien = aliens[i]
        if (alien.swarm) {
            minx = Math.min(minx, alien.x)
            miny = Math.min(miny, alien.y)
            maxx = Math.max(maxx, alien.x + alien.image.naturalWidth)
            maxy = Math.max(maxy, alien.y + alien.image.naturalHeight)

            if (!aliensByX[alien.x]) {
                aliensByX[alien.x] = [alien]
            }
            else {
                aliensByX[alien.x].push(alien)
            }
        }
    }
    swarmPos.x = minx
    swarmPos.y = miny
    swarmPos.w = maxx - minx
    swarmPos.h = maxy - miny

    if ((maxy) > shipY) {
        ship.lives = 0
        queueGameOver()
    }

    let aliensFire = []
    for (var x in aliensByX) {
        let relevant = aliensByX[x]
        aliensFire.push(relevant[relevant.length - 1])
    }

    return aliensFire
}

function scoreDisplayZeros() {
    if (playerScore < 10) {
        displayScore = '000' + playerScore
    } else if (playerScore < 100) {
        displayScore = '00' + playerScore
    } else if (playerScore < 1000) {
        displayScore = '0' + playerScore
    } else {
        displayScore = playerScore
    }
}

function scoreDisplayHighScoreZeros() {
    if (playerScore < 10) {
        displayHighScore = '000' + playerScore
    } else if (playerScore < 100) {
        displayHighScore = '00' + playerScore
    } else if (playerScore < 1000) {
        displayHighScore = '0' + playerScore
    } else {
        displayHighScore = playerScore
    }
}

const invadersFont = new FontFace('VT323', 'url(fonts/VT323-Regular.ttf)')
document.fonts.add(invadersFont)
invadersFont.load()

function gameloop(timestamp) {
    if (start === undefined)
        start = timestamp
    var elapsed = timestamp - start
    if (elapsed > 30) {
        console.log("WARNING: going slow")
        elapsed = 30
    }

    ship.elapsed_score += playerScore - last_score
    last_score = playerScore

    start = timestamp

    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    scoreDisplayZeros()

    ctx.fillStyle = "white"
    ctx.font = '16px VT323'
    ctx.fillText("SCORE", 9, 16)
    ctx.fillText(displayScore, 12, 32)
    ctx.fillText("HI-SCORE", 125, 16)
    ctx.fillText(displayHighScore, 125, 32)
    ctx.fillText(ship.lives, 5, 355)
    
    ctx.beginPath()
    ctx.moveTo(0, lineY)
    ctx.lineTo(300, lineY)
    ctx.strokeStyle = "rgb(76, 175, 80)"
    ctx.stroke()

    for (let i = 0; i < ship.lives - 1; i++) {
        ctx.drawImage(shipIm, i*15 + 15, 347)
    }

    if (leftPressed) {
        ship.x -= strafeSpeed * elapsed
    }
    if (rightPressed) {
        ship.x += strafeSpeed * elapsed
    }

    ship.x = Math.max(0, ship.x)
    ship.x = Math.min(BASESIZE.w, ship.x + ship.image.naturalWidth) - ship.image.naturalWidth

    let aliensFire = map_swarm(aliens)

    fireTime -= elapsed
    if (fireTime < 0 && aliensFire.length) {
        let angryAlien = aliensFire[Math.floor(Math.random() * aliensFire.length)]
        let centerx = (angryAlien.x + angryAlien.image.naturalWidth / 2) - (missileIm.naturalWidth/2)
        missiles.push({x: centerx, y: angryAlien.y, dead:false, image: missileIm,
                       update: missile_update})
        fireTime = Math.random() * 3000
    }

    swarmSwitchTime -= elapsed
    swarmSwitchImage = false
    if (swarmSwitchTime < 0) {
        swarmSwitchImage = true
        swarmSwitchTime = 500
    }

    if (!swarmY && swarmPos.x < 10) {
        swarmY = 1
        swarmX = 0
        swarmTargetY = swarmPos.y + 20
        swarmNextX = 1
    }

    if (!swarmY && swarmPos.x + swarmPos.w > BASESIZE.w - 10) {
        swarmY = 1
        swarmX = 0
        swarmTargetY = swarmPos.y + 15
        swarmNextX = -1
    }

    if (!swarmX && swarmPos.y > swarmTargetY) {
        swarmX = swarmNextX
        swarmY = 0
    }

    swarmPos.x += swarmX * swarm_speed * elapsed
    swarmPos.y += swarmY * swarm_speed * elapsed

    if (aliensFire.length == 0 && !gameover) {
        aliens = spawnAliens()
        levels += 1
        aliens = spawnAliens(30 + 15*levels)
        alien_speed1 = false
        alien_speed2 = false
        alien_speed3 = false
        speed_multiplier = 1
    }

    if (aliens.length <= 33 && !alien_speed1) {
        alien_speed1 = true
        speed_multiplier = 1.5
    }

    if (aliens.length <= 11 && !alien_speed2) {
        alien_speed2 = true
        speed_multiplier = 2
    }

    if (aliens.length <= 1 && !alien_speed3) {
        alien_speed3 = true
        speed_multiplier = 3
    }

    execute_collision(bullets, aliens)
    execute_collision(ships, missiles)
    execute_collision(bullets, missiles)
    execute_collision(barriers, missiles)
    execute_collision(barriers, bullets)

    display_entities(bullets, elapsed)
    display_entities(aliens, elapsed*speed_multiplier)
    display_entities(missiles, elapsed)
    display_entities(ships, elapsed)
    display_entities(barriers, elapsed)
    display_entities(effects, elapsed)

    window.requestAnimationFrame(gameloop)
}

function shoot(e) {
    if (!ship.can_fire || ship.dead) {
        return
    }

    if (e.key.toLowerCase() == "w") {
        let centerx = (ship.x + ship.image.naturalWidth / 2)  - bulletIm.naturalWidth / 2
        bullets.push({x: centerx, y: 320, dead:false, image: bulletIm,
                      update: bullet_update})
        ship.can_fire = false
        ship.time_since = 0
        bulletSound.play()
    }
}

document.addEventListener('keypress', shoot, false)

modalStartButton.addEventListener('click', function(){

    startModal.style.display = "none"
    window.requestAnimationFrame(gameloop)

})

function keyDownHandler(e) {
    if (e.key.toLowerCase() == "a"|| e.key == "ArrowLeft") {
        leftPressed = true
    }
    if (e.key.toLowerCase() == "d" || e.key == "ArrowRight") {
        rightPressed = true
    }
}

function keyUpHandler(e) {
    if (e.key.toLowerCase() == "a" || e.key == "ArrowLeft") {
        leftPressed = false
    }    
    if (e.key.toLowerCase() == "d" || e.key == "ArrowRight") {
        rightPressed = false
    }
}

function sound(src) {
    this.sound = document.createElement("audio")
    this.sound.src = src
    this.sound.setAttribute("preload", "auto")
    this.sound.setAttribute("controls", "none")
    this.sound.style.display = "none"
    document.body.appendChild(this.sound)
    this.play = function(){
      this.sound.play()
    }
    this.stop = function(){
      this.sound.pause()
    }
}

document.addEventListener("keydown", keyDownHandler, false)
document.addEventListener("keyup", keyUpHandler, false)
modalSaveScoreButton.addEventListener('click', saveScore)
modalPlayAgainButton.addEventListener('click', playAgain)