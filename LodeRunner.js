/*     Lode Runner

Aluno 1: 54982 Joao Arvana 
Aluno 2: 55596 Sara Relvas 

Comentario:

Aluno 1: 54982 Joao Arvana 
Aluno 2: 55596 Sara Relvas 

Todas as funcionalidades foram implementadas, seguindo as regras e o enunciado disponilibizado.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
*/


// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global

let empty, hero, control;

// ACTORS

class Actor {
    constructor(x, y, imageName) {
        this.x = x;
        this.y = y;
        this.imageName = imageName;
        this.time = 0;	// timestamp used in the control of the animations
        this.show();
    }

    draw(x, y) {
        control.ctx.drawImage(GameImages[this.imageName],
            x * ACTOR_PIXELS_X, y * ACTOR_PIXELS_Y);
    }

    move(dx, dy) {
        this.hide();
        this.x += dx;
        this.y += dy;
        this.show();
    }

    isBlocking() {
        return false;
    }

    animation() {

    }

}

class PassiveActor extends Actor {
    show() {
        control.world[this.x][this.y] = this;
        this.draw(this.x, this.y);
    }
    hide() {
        control.world[this.x][this.y] = empty;
        empty.draw(this.x, this.y);
    }

    // Solid when false says you can be inside of it
    isSolid() {
        return false;
    }

    // These when false indicate wich sides you can go through
    sidesAreSolid(){
        return this.isSolid();
    }

    topAndBottomIsSolid(){
        return this.isSolid();
    }

    isBlocking() {
        return this.isSolid();
    }

    isBreakable() {
        return false;
    }

    canClimb() {
        return false;
    }

    canHang() {
        return false;
    }

    isCollectible() {
        return false;
    }
}


class Brick extends PassiveActor {
    constructor(x, y) {
        super(x, y, "brick");
        this.timeWhenFellIntoBlock = Infinity;
        this.timeToSpendOnHole = 5 * ANIMATION_EVENTS_PER_SECOND;
    }

    isSolid() {
        return !this.currentlyBroken();
    }

    isBreakable() {
        return true;
    }

    currentlyBroken() {
        return (this.imageName == "empty");
    }

    break() {
        this.hide();
        this.imageName = "empty";
        this.show();
    }

    regen() {
        this.hide();
        this.imageName = "brick";
        this.show();
    }

    someoneInside() {
        if (this.timeWhenFellIntoBlock == Infinity) {
            this.timeWhenFellIntoBlock = this.time;
        }
    }

    animation() {
        if (this.time - this.timeWhenFellIntoBlock >= this.timeToSpendOnHole) {
            this.timeWhenFellIntoBlock = Infinity;
            let aActorInside = control.get(this.x, this.y)
            this.regen();
            if (aActorInside instanceof ActiveActor)
                aActorInside.die();
        }
    }
}

class Chimney extends PassiveActor {
    constructor(x, y) { super(x, y, "chimney"); }

    sidesAreSolid(){
        return true;
    }

}

class Empty extends PassiveActor {
    constructor() { super(-1, -1, "empty"); }

    show() { }
    hide() { }
}

class Gold extends PassiveActor {
    constructor(x, y) { super(x, y, "gold"); control.collectibles++ ; this.score = 10;}

    isCollectible() {
        return true;
    }

    collect() {
        /*
            No need to hide, you can just remove it from the world because it is only collected when
            an active actor is over it, and when they move away from the top of it whats behind them
            gets drawn, and since its now empty it just draws the empty. If we leave the hide it
            will hide the character instead.
        */
        //this.hide();
        control.world[this.x][this.y] = empty;
    }

    drop(x, y) {
        this.x = x;
        this.y = y;
        this.show();
    }
}

class Invalid extends PassiveActor {
    constructor(x, y) { super(x, y, "invalid"); }
}

class Ladder extends PassiveActor {
    constructor(x, y) {
        super(x, y, "empty");
    }

    makeVisible() {
        this.hide();
        this.imageName = "ladder";
        this.show();
    }

    isVisible() {
        return this.imageName == "ladder";
    }

    canClimb() {
        return this.imageName == "empty" ? false : true;
    }

    animation(){
        if(control.toOpenExit && !this.isVisible()){
            this.makeVisible();
        }
    }
}

class Rope extends PassiveActor {
    constructor(x, y) { super(x, y, "rope"); }

    canHang() {
        return true;
    }
}

class Stone extends PassiveActor {
    constructor(x, y) { super(x, y, "stone"); }

    isSolid() {
        return true;
    }
}

class Boundary extends Stone {
    constructor() { super(-1, -1); }
    show() { };
    hide() { };
}


class ActiveActor extends Actor {
    constructor(x, y, imageName) {
        super(x, y, imageName);
        this.facingLeft = true;
        this.respawnX = x;
        this.respawnY = y;
    }

    show() {
        control.worldActive[this.x][this.y] = this;
        this.draw(this.x, this.y);
    }

    hide() {
        control.worldActive[this.x][this.y] = empty;
        control.world[this.x][this.y].draw(this.x, this.y);
    }

    isBlocking() {
        return true;
    }

    isGood() {
        return true;
    }

    move(dx, dy) {
        let current = control.getBehind(this.x, this.y);
        let next = control.get(this.x + dx, this.y + dy);
        let nextB = control.getBehind(this.x + dx, this.y + dy);
        if (dx == 0 && dy == -1 && !current.canClimb());
        else if ((dx == -1 || dx == 1) && dy==0 && nextB.sidesAreSolid());
        else if ((dy == -1 || dy == 1) && dx==0 && nextB.topAndBottomIsSolid());
        else if (!next.isBlocking()) {
            this.hide();
            this.x += dx;
            this.y += dy;
            this.show();
        }
    }

    teleport(x, y) {
        let destination = control.get(x, y);
        if (!destination.isBlocking() && !destination.isSolid()) {
            this.hide();
            this.x = x;
            this.y = y;
            this.show();
        }
    }

    isFalling() {
        let behind = control.getBehind(this.x, this.y);
        let below = control.get(this.x, this.y + 1);

        return !below.isBlocking() &&
            !(behind.canHang() || behind.canClimb()) &&
            !(below.topAndBottomIsSolid() || below.canClimb());
    }

    onCollectible() {
        let behind = control.getBehind(this.x, this.y);
        return behind.isCollectible();
    }

    collect() {

    }

    respawn() {
        this.hide();
        this.x = this.respawnX;
        this.y = this.respawnY;
        this.show();
    }

    die() {
        this.respawn();
    }
}

class Hero extends ActiveActor {
    constructor(x, y) {
        super(x, y, "hero_runs_left");
        this.isShooting = false;
        this.collectibleArray = [];
    }

    getCollectibleCount() {
        return this.collectibleArray.length;
    }

    knockback() {
        if (this.facingLeft) {
            this.move(1, 0);
        } else {
            this.move(-1, 0);
        }
    }

    shoot() {
        let next;
        let nextBelow;
        let behind;
        let behindBelow;
        let currentBellow = control.getBehind(this.x, this.y+1);

        if (this.facingLeft) {
            next = control.getBehind(this.x - 1, this.y);
            nextBelow = control.getBehind(this.x - 1, this.y + 1);

            behind = control.getBehind(this.x + 1, this.y);
            behindBelow = control.getBehind(this.x + 1, this.y + 1);
        } else {
            next = control.getBehind(this.x + 1, this.y);
            nextBelow = control.getBehind(this.x + 1, this.y + 1);

            behind = control.getBehind(this.x - 1, this.y);
            behindBelow = control.getBehind(this.x - 1, this.y + 1);
        }

        if(currentBellow.isSolid() || currentBellow.canClimb()){
            this.isShooting = true;
            this.show();

            if (!next.isSolid() && nextBelow != empty && nextBelow.isBreakable())
            nextBelow.break();


            if (!behind.isSolid() && (behindBelow.isSolid() || behindBelow.canClimb()))
                this.knockback();

            this.isShooting = false;
        }  
    }

    collect() {
        let behind = control.getBehind(this.x, this.y);
        this.collectibleArray.push(behind);
        behind.collect();
        control.points += behind.score;
    }

    animation() {
        this.show();

        let k = control.getKey();
        // Movement
        if (this.isFalling())
            this.move(0, 1);
        else if (k == ' ')
            this.shoot();
        else if (k == null) {
            ;
        }
        else {
            let [dx, dy] = k;

            let next = control.get(this.x + dx, this.y + dy);
            if (next instanceof ActiveActor && !next.isGood()) {
                hero.die();
            }

            if (dx < 0)
                this.facingLeft = true;
            else if (dx > 0)
                this.facingLeft = false;
            this.move(dx, dy);
        }

        // Action and states
        if (this.onCollectible()) {
            this.collect();
            if (this.hasAllCollectibles())
                control.openExit();
        }
        else if (control.getBehind(this.x, this.y).isBreakable())
            control.getBehind(this.x, this.y).someoneInside();
        else if (this.hasWon())
            control.win();
    }

    show() {
        let behind = control.getBehind(this.x, this.y);
        if (this.facingLeft) {
            if (this.isFalling()) {
                this.imageName = "hero_falls_left";
            }
            else if (behind.canClimb()) {
                this.imageName = "hero_on_ladder_left";
            }
            else if (behind.canHang()) {
                this.imageName = "hero_on_rope_left";
            } else if (this.isShooting) {
                this.imageName = "hero_shoots_left";
            }
            else {
                this.imageName = "hero_runs_left";
            }

        } else {
            if (this.isFalling()) {
                this.imageName = "hero_falls_right";
            }
            else if (behind.canClimb()) {
                this.imageName = "hero_on_ladder_right";
            }
            else if (behind.canHang()) {
                this.imageName = "hero_on_rope_right";
            } else if (this.isShooting) {
                this.imageName = "hero_shoots_right";
            }
            else {
                this.imageName = "hero_runs_right";
            }
        }
        super.show();
    }

    hasAllCollectibles() {
        return this.getCollectibleCount() == control.collectibles;
    }

    hasWon() {
        let behind = control.getBehind(this.x, this.y);
        return this.hasAllCollectibles() && behind.canClimb() && this.y == 0;
    }

    die() {
        if(!control.heroIsDead){
            control.lives--;
            
            if (control.lives <= 0)
                control.heroDefeated();
            else
                control.heroDead();
        }
    }
}

class Robot extends ActiveActor {
    constructor(x, y) {
        super(x, y, "robot_runs_right");
        this.dx = 1;
        this.dy = 0;
        this.collectible = null;
        this.timeWhenFellIntoBlock = Infinity;
        this.timeToSpendOnHole = 3 * ANIMATION_EVENTS_PER_SECOND;
        this.timeWhenGrabbedCollectible = Infinity;
        this.timeToHoldTheCollectible = 10 * ANIMATION_EVENTS_PER_SECOND;
    }

    respawn() {
        this.timeWhenFellIntoBlock = Infinity;
        super.respawn();
    }

    isGood() {
        return false;
    }

    safeDropGoldHole() {
        let currLevel = 0;
        // While because it can have broken blocks on top of him that have already regen.
        while (control.getBehind(this.x, this.y - currLevel) != empty) {
            let top = control.getBehind(this.x, this.y - currLevel - 1);
            let topL = control.getBehind(this.x - 1, this.y - currLevel - 1);
            let topR = control.getBehind(this.x + 1, this.y - currLevel - 1);
            let topLBelow = control.getBehind(this.x - 1, this.y - currLevel);
            let topRBelow = control.getBehind(this.x + 1, this.y - currLevel);
            
            // First tries to drop the gold on top of him, if he can't he tries to drop it on
            // top to the side he's looking at.
            // If he fails both tries he doens't drop the gold.
            if (top == empty) {
                // No need to check if the block below is solid, because since he is in a hole
                // we already know that below is a brick
                this.collectible.drop(this.x, this.y - currLevel - 1);
                return true;
            } else if (this.facingLeft) {
                if (topL == empty && topLBelow.isSolid()) {
                    this.collectible.drop(this.x - 1, this.y - currLevel - 1);
                    return true;
                }
                else if (topR == empty && topRBelow.isSolid()) {
                    this.collectible.drop(this.x + 1, this.y - currLevel - 1);
                    return true;
                }
            } else if (!this.facingLeft) {
                if (topR == empty && topRBelow.isSolid()) {
                    this.collectible.drop(this.x + 1, this.y - currLevel - 1);
                    return true;
                } else if (topL == empty && topLBelow.isSolid()) {
                    this.collectible.drop(this.x - 1, this.y - currLevel - 1);
                    return true;
                }
            }
            
        }
        return false;
    }

    safeDropGoldStanding(){
        let curr = control.getBehind(this.x, this.y);
        let currL = control.getBehind(this.x - 1, this.y);
        let currR = control.getBehind(this.x + 1, this.y);
        let currLBelow = control.getBehind(this.x - 1, this.y+1);
        let currRBelow = control.getBehind(this.x + 1, this.y+1);
         
        // First tries to drop the gold behind him, if he can't he tries on the same spot he is.
        // If he fails both tries he doens't drop the gold.
        if(this.facingLeft){
            if (currR == empty && currRBelow.isSolid()) {
                this.collectible.drop(this.x + 1, this.y);
                return true;
            } else if (currL == empty && currLBelow.isSolid()) {
                this.collectible.drop(this.x - 1, this.y);
                return true;
            } 
        } else if (!this.facingLeft){
            if (currL == empty && currLBelow.isSolid()) {
                this.collectible.drop(this.x - 1, this.y);
                return true;
            } else if (currR == empty && currRBelow.isSolid()) {
                this.collectible.drop(this.x + 1, this.y);
                return true;
            }
        } else if (curr == empty) {
            // No need to check if the block below is solid, because since he is standing on it
            // we already know it's solid
            this.collectible.drop(this.x, this.y);
            return true;
        } else { 
            return false;
        }
    }

    drop() {
        let curr = control.getBehind(this.x, this.y);
        let below = control.getBehind(this.x, this.y+1);
        let status = false;
        if(curr.isBreakable()){
            status = this.safeDropGoldHole();
            if (status)
                this.collectible = null;
        }else if (below.isSolid()){
            status = this.safeDropGoldStanding();
            if (status)
                this.collectible = null;
        }

        if(status)
            this.timeWhenGrabbedCollectible = Infinity;

        return status;
    }

    collect() {
        let behind = control.getBehind(this.x, this.y);
        this.collectible = behind;
        behind.collect();
    }

    minDistance(dir) {
        let [dx, dy] = dir;

        return Math.sqrt(Math.pow((hero.x - (this.x + dx)), 2)
            + Math.pow((hero.y - (this.y + dy)), 2));
    }

    chooseDir() {
        let upDist = Infinity;
        let downDist = Infinity;
        let leftDist = Infinity;
        let rightDist = Infinity;

        let upSpot = control.getBehind(this.x, this.y - 1);
        let downSpot = control.getBehind(this.x, this.y + 1);
        let leftSpot = control.getBehind(this.x - 1, this.y);
        let rightSpot = control.getBehind(this.x + 1, this.y);

        let up = [0, -1];
        let down = [0, 1];
        let left = [-1, 0];
        let right = [1, 0];

        let currentSpot = control.getBehind(this.x, this.y);

        if (!upSpot.isSolid() && currentSpot.canClimb())
            upDist = this.minDistance(up);

        if (!downSpot.isSolid())
            downDist = this.minDistance(down);


        if (!leftSpot.isSolid())
            leftDist = this.minDistance(left);

        if (!rightSpot.isSolid())
            rightDist = this.minDistance(right);


        let currMinDist = Infinity;
        let currMinDir = [0, 0];

        if (upDist < currMinDist) {
            currMinDir = up;
            currMinDist = upDist;
        }
        if (downDist < currMinDist) {
            currMinDir = down;
            currMinDist = downDist;
        }
        if (leftDist < currMinDist) {
            currMinDir = left;
            currMinDist = leftDist;
        }
        if (rightDist < currMinDist) {
            currMinDir = right;
            currMinDist = rightDist;
        }

        return currMinDir;

    }

    safeExitHole() {
        if (hero.x < this.x)
            this.facingLeft = true;
        else if (hero.x > this.x)
            this.facingLeft = false;


        let currLevel = 0;
        // While because it can have broken blocks on top of him that have already regen.
        while (control.getBehind(this.x, this.y - currLevel).isBreakable()) {
            let top = control.get(this.x, this.y - currLevel - 1);
            let topL = control.get(this.x - 1, this.y - currLevel - 1);
            let topR = control.get(this.x + 1, this.y - currLevel - 1);
            if (this.facingLeft) {
                if (!topL.isBlocking()) {
                    this.teleport(this.x - 1, this.y - currLevel - 1);
                    return true;
                }
                else if (!topR.isBlocking()) {
                    this.teleport(this.x + 1, this.y - currLevel - 1);
                    return true;
                }
                else if (!top.isBlocking()) {
                    this.teleport(this.x, this.y - currLevel - 1);
                    return true;
                }
            }
            else if (!this.facingLeft) {
                if (!topR.isBlocking()) {
                    this.teleport(this.x + 1, this.y - currLevel - 1);
                    return true;
                }
                else if (!topL.isBlocking()) {
                    this.teleport(this.x - 1, this.y - currLevel - 1);
                    return true;
                }
                else if (!top.isBlocking()) {
                    this.teleport(this.x, this.y - currLevel - 1);
                    return true;
                }
            }
        }
    }

    animation() {
        if (this.time % 3 == 0) {
            this.hide();
            this.show();
            if (this.onCollectible() && !this.hasCollectible()) {
                this.timeWhenGrabbedCollectible = this.time;
                this.collect();
            }
            else if (control.getBehind(this.x, this.y).isBreakable()) {
                if (this.hasCollectible())
                    this.drop();
                if (this.timeWhenFellIntoBlock == Infinity) {
                    this.timeWhenFellIntoBlock = this.time;
                    control.getBehind(this.x, this.y).someoneInside();
                }
                if (this.time - this.timeWhenFellIntoBlock >= this.timeToSpendOnHole) {
                    if (this.safeExitHole())
                        this.timeWhenFellIntoBlock = Infinity;
                }
            }
            else if (this.isFalling()) {
                this.move(0, 1);
            }
            else {

                if(this.hasCollectible() && 
                (this.time - this.timeWhenGrabbedCollectible)>=this.timeToHoldTheCollectible){
                    this.drop();
                }

                let [dx, dy] = this.chooseDir();

                let next = control.get(this.x + dx, this.y + dy);
                if (next instanceof ActiveActor && next.isGood()) {
                    hero.die();
                }

                if (dx < 0)
                    this.facingLeft = true;
                else if (dx > 0)
                    this.facingLeft = false;
                this.move(dx, dy);
            }
        }
    }

    show() {
        let behind = control.getBehind(this.x, this.y);
        if (this.facingLeft) {
            if (this.isFalling()) {
                this.imageName = "robot_falls_left";
            }
            else if (behind.canClimb()) {
                this.imageName = "robot_on_ladder_left";
            }
            else if (behind.canHang()) {
                this.imageName = "robot_on_rope_left";
            }
            else {
                this.imageName = "robot_runs_left";
            }

        } else {
            if (this.isFalling()) {
                this.imageName = "robot_falls_right";
            }
            else if (behind.canClimb()) {
                this.imageName = "robot_on_ladder_right";
            }
            else if (behind.canHang()) {
                this.imageName = "robot_on_rope_right";
            }
            else {
                this.imageName = "robot_runs_right";
            }
        }
        super.show();
    }

    hasCollectible() {
        return this.collectible != null;
    }
}



// GAME CONTROL

class GameControl {
    constructor() {
        control = this;
        this.key = 0;
        this.canvas = document.getElementById("canvas1");
        this.ctx = this.canvas.getContext("2d");
        empty = new Empty();	// only one empty actor needed
        this.boundary = new Boundary();
        this.eventInterval;
        this.audio = null;
        this.paused = false;
        this.started = false;
        // Audio won't start playing because user has to interact with the page first, we still put
        // this here to create the variable that has the music, and defines the music paused state
        // as true.
        this.startAudio("http://ctp.di.fct.unl.pt/miei/lap/projs/proj2020-3/files/louiscole.m4a");
        updateMusicButtons();
        this.startGameCanvas();
    }

    startGame(){
        this.started = true;
        this.reset();
        this.nextLevel();
    }

    reset() {
        if(!this.paused){
            clearInterval(this.eventInterval);
        }
        this.time = 0;
        this.level = 0;
        this.points = 0;
        this.lvStartPoints = this.points;
        this.lives = 3;
        this.heroIsDefeated = false;
        this.heroIsDead = false;;
        document.getElementById("change_level").disabled = false;
        if(!this.paused){
            this.setupEvents();
        } else {
            this.paused = false;
        }
    }

    resetLevel() {
        this.level = --this.level;
        this.points = this.lvStartPoints;
        control.nextLevel();
    }


    clearMap() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.world = this.createMatrix();
        this.worldActive = this.createMatrix();
    }

    heroDefeated() {
        this.heroIsDefeated = true;
    }

    heroDead() {
        this.heroIsDead = true;
    }

    gameOverCanvas() {
        clearInterval(this.eventInterval);
        this.clearMap();
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#FF0000";
        this.ctx.font = " bold 48px 'Press Start 2P'";
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = " bold 14px 'Press Start 2P'";
        this.ctx.fillText("Click Reset Game to try again", this.canvas.width / 2, 160);
    }

    startGameCanvas(){
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let img = new Image();
        img.src = "http://ctp.di.fct.unl.pt/miei/lap/projs/proj2020-3/files/images/brick.png";
        let ptrn = this.ctx.createPattern(img, 'repeat');
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = ptrn;
        this.ctx.font="bold 70px 'Press Start 2P'";
        this.ctx.fillText("LODE",this.canvas.width / 2, (this.canvas.height / 6) + 50);
        this.ctx.fillText("RUNNER",this.canvas.width / 2, (this.canvas.height / 6) + 120);
        this.ctx.font="bold 11px 'Press Start 2P'";
        this.ctx.fillStyle = "#2BFFFC"
        this.ctx.fillText("2020  João Arvana",this.canvas.width / 2 + 29, 
        (this.canvas.height)/2 + 110);
        this.ctx.fillText("@FCT/UNL  Sara Relvas",(this.canvas.width / 2) + 9,
        (this.canvas.height)/2 + 125);
        this.ctx.font="bold 15px 'Press Start 2P'";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillText("Click Start Game to Play",this.canvas.width / 2, 
        (this.canvas.height)/2 + 80);
        this.ctx.strokeStyle = "#2BFFFC";
        this.ctx.lineWidth = 5;
        this.ctx.moveTo(243,230);
        this.ctx.lineTo(243,264)
        this.ctx.stroke();
    }

    finishGameCanvas() {
        clearInterval(this.eventInterval);
        this.clearMap();
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = " bold 55px 'Press Start 2P'";
        this.ctx.fillText("YOU WIN! ", this.canvas.width / 2 + 28, (this.canvas.height / 2) + 20);   
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = " bold 11px 'Press Start 2P'";
        this.ctx.fillText("Click Reset Game to Play Again", this.canvas.width / 2, 
        (this.canvas.height / 2) + 40);
    }

    nextLevel() {
        ++this.level;

        if (this.level > 16) {
            this.finishGameCanvas();
            return;
        }

        this.clearMap();
        this.lvStartPoints = this.points;
        this.collectibles = 0;
        this.toOpenExit = false;
        this.toChangeLevel = false;

        this.loadLevel(this.level);
    }

    // Empty world representation
    createMatrix() { // stored by columns
        let matrix = new Array(WORLD_WIDTH);
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let a = new Array(WORLD_HEIGHT);
            for (let y = 0; y < WORLD_HEIGHT; y++)
                a[y] = empty;
            matrix[x] = a;
        }
        return matrix;
    }
    // Load into canvas
    loadLevel(level) {
        if (level < 1 || level > MAPS.length)
            fatalError("Invalid level " + level)
        let map = MAPS[level - 1];  // -1 because levels start at 1
        for (let x = 0; x < WORLD_WIDTH; x++)
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                // x/y reversed because map stored by lines
                GameFactory.actorFromCode(map[y][x], x, y);
            }
    }
    getKey() {
        let k = control.key;
        control.key = 0;
        switch (k) {
            case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
            case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
            case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
            case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
            case 0: return null;
            default: return String.fromCharCode(k);
            // http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
        };
    }
    setupEvents() {
        addEventListener("keydown", this.keyDownEvent, false);
        addEventListener("keyup", this.keyUpEvent, false);
        this.eventInterval = setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
    }

    openExit() {
        this.toOpenExit = true;
    }

    win() {
        this.toChangeLevel = true;
    }

    togglePause(){
        this.paused = !this.paused;
    }

    checkPause(){
        if(!control.paused)
            control.setupEvents()
        else
            setTimeout(()=>{
                control.checkPause();
            },500);
    }

    animationEvent() {
        if(control.paused){
            clearInterval(control.eventInterval);
            setTimeout(()=>{
                control.checkPause();
            },500);
        }

        control.time++;
        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                let a = control.worldActive[x][y];
                if (a.time < control.time) {
                    a.time = control.time;
                    a.animation();
                }
            }
        }

        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                let b = control.world[x][y];
                if (b.time < control.time) {
                    b.time = control.time;
                    b.animation();
                }
            }
        }

        if (control.toChangeLevel)
            control.nextLevel();

        if (control.heroIsDefeated) {
           control.gameOverCanvas();
        }

        if (control.heroIsDead) {
            control.heroIsDead = false;
            control.resetLevel();
        }

        update();
    }

    keyDownEvent(k) {
        control.key = k.keyCode;
    }

    keyUpEvent(k) {
    }

    isInside(x, y) {
        return 0 <= x && x < WORLD_WIDTH && 0 <= y && y < WORLD_HEIGHT;
    }

    get(x, y) {
        if (!this.isInside(x, y))
            return this.boundary;
        if (control.worldActive[x][y] !== empty)
            return control.worldActive[x][y];
        else
            return control.world[x][y];
    }
    getBehind(x, y) {
        if (!this.isInside(x, y))
            return this.boundary;
        return control.world[x][y];
    }

    resetGame() {
        this.reset();
        control.nextLevel();
    }

    getTimer() {
        return control.time;
    }

    getPoints() {
        return control.points;
    }

    getLives() {
        return control.lives;
    }

    change_level(level) {
        this.reset();
        this.level = --level;
        control.nextLevel();
    }

    getCurrentLevel(){
        return control.level;
    }

    getNTotalCollectibles() {
        return control.collectibles;
    }

    startAudio(url) {
        if(control.audio == null )
            control.audio = new Audio(url);
        control.audio.loop = true;
        control.audio.play();  // requires a previous user interaction with the page
    }
    
    pauseAudio() {
        if(control.audio != null)
            control.audio.pause();
    }

    toggleMusic(){
        if(control.audio.paused){
            control.audio.play();
        } else {
            control.pauseAudio();
        }
    }

}


// HTML FORM

function reset_game() { control.resetGame() }
function get_progressTotal() { return control.getNTotalCollectibles() }
function get_progressHero() { return hero.getCollectibleCount() }
function get_points() { return control.getPoints() }
function get_timer() { return control.getTimer() }
function get_lives() { return control.getLives() }
function get_current_level(){ return control.getCurrentLevel() }

function update() {
    let hc = document.getElementById("progressHeroCollectibles");
    hc.innerHTML = get_progressHero();
    let tc = document.getElementById("progressTotalCollectibles");
    tc.innerHTML = get_progressTotal();
    let t = document.getElementById("timer");
    t.innerHTML = get_timer();
    let p = document.getElementById("points");
    p.innerHTML = get_points();
    let l = document.getElementById("lives");
    l.innerHTML = get_lives();
    let lv = document.getElementById("currentlevel");
    lv.innerHTML = get_current_level();

    updatePauseButtons();
    updateMusicButtons();
}

function updateMusicButtons(){
    if(control.audio.paused){ 
        document.getElementById("pauseaudio").value = "Start Music";
    } else {
        document.getElementById("pauseaudio").value = "Stop Music";
    }
}

function updatePauseButtons(){
    if(control.paused){
        document.getElementById("pausegame").value = "Unpause Game";
    }
    else {
        document.getElementById("resetgame").disabled = false;
        document.getElementById("change_level").disabled = false;
        document.getElementById("pausegame").value = "Pause Game";
    }
}

function onLoad() {
    // Asynchronously load the images an then run the game
    GameImages.loadAll(function () { new GameControl(); });

    document.getElementById("resetgame").onclick = () => { control.resetGame() };
    document.getElementById("pausegame").onclick = () => { 
        if(!control.started)
            control.startGame();
        else
            control.togglePause();
        updatePauseButtons();
    };

    document.getElementById("pauseaudio").onclick = () => { 
        control.toggleMusic();
        updateMusicButtons();
    };
    

    document.getElementById("change_level").onclick = () => {
        control.change_level(
            document.getElementById("levels").options[
                document.getElementById("levels").selectedIndex
            ].value
        )
    };
}




