
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('bullet', 'assets/games/invaders/bullet.png');
    game.load.image('enemyBullet', 'assets/games/invaders/enemy-bullet.png');
    game.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
    game.load.image('ship', 'assets/games/invaders/player.png');
    game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
    game.load.image('starfield', 'assets/games/invaders/starfield.png');
    game.load.image('background', 'assets/games/starstruck/background2.png');
    game.load.image('menu', 'assets/games/menu.png');

}
//variables por defecto del juego
var w=800;
var h=400;
var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var fireButton;
var explosions;
var starfield;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var enemyBullet;
var firingTimer = 0;
var stateText;
var livingEnemies = [];
//Variables añadidas
var modoAuto = false, eCompleto=false;
var nnNetwork,
    nnEntrenamiento,
    nnSalida,
    datosEntrenamiento = [];


var objetivo; //puede que nos sirva para obetener las balas que dispara el enemigo
var shooterX; //posicion de la bala en x
var shooterY; //posicion de la bala en y
var playerPosX; //posicion del jugador en x
var playerPosY; //posicion del jugador en y

var bullet; 


function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Our bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    //Pause
    pausaL = game.add.text(w - 100, 500, 'Pausa', { font: '20px Arial', fill: '#fff' });
    pausaL.inputEnabled = true;
    pausaL.events.onInputUp.add(pausa, self);
    game.input.onDown.add(mPausa, self);

    // The enemy's bullets
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    //  The hero!
    player = game.add.sprite(400, 500, 'ship');
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    //  The baddies!
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;

    createAliens();

    //  The score
    scoreString = 'Score : ';
    scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

    //  Lives
    lives = game.add.group();
    game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });

    //  Text
    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (var i = 0; i < 3; i++) 
    {
        var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
        ship.anchor.setTo(0.5, 0.5);
        ship.angle = 90;
        ship.alpha = 0.4;
    }

    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    
    nnNetwork = new synaptic.Architect.Perceptron(2, 10, 2);
    nnEntrenamiento = new synaptic.Trainer(nnNetwork);

    
    
        
}



function enRedNeural(){
    var neuronalDatos = nnEntrenamiento.train(datosEntrenamiento, {
        rate: 0.0003, 
        iterations: 18000, 
        shuffle: true,
        }
    );
    console.log(neuronalDatos);

}

function datosDeEntrenamiento(param_entrada){
    
    //console.log("Entrada - Pos balax: ",param_entrada[0]," Pos jugador x: ",param_entrada[1]);
    console.log(`Entrada: ${param_entrada[0]}, ${param_entrada[1]}`);
    nnSalida = nnNetwork.activate(param_entrada);
    console.log(nnSalida);
    
    //console.log("Valor ","posicion en x derecha%: "+ derecha + "x izquierda " + izquierda );
    
    return nnSalida[0]>nnSalida[1];


    /* console.log(param_entrada); 
    var result = myNetwork.activate(param_entrada);
    if (result > .5) return true
    return false; */


}

function pausa(){
    game.paused = true;
    menu = game.add.sprite(w/2,h/2, 'menu');
    menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event){
    if(game.paused){
        var menu_x1 = w/2 - 270/2, menu_x2 = w/2 + 270/2,
            menu_y1 = h/2 - 180/2, menu_y2 = h/2 + 180/2;

        var mouse_x = event.x  ,
            mouse_y = event.y  ;

        if(mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2 ){
            if(mouse_x >=menu_x1 && mouse_x <=menu_x2 && mouse_y >=menu_y1 && mouse_y <=menu_y1+90){
                eCompleto=false;
                datosEntrenamiento = [];
                modoAuto = false;
            }else if (mouse_x >=menu_x1 && mouse_x <=menu_x2 && mouse_y >=menu_y1+90 && mouse_y <=menu_y2) {
                if(!eCompleto) {
                    console.log("","Entrenamiento "+ datosEntrenamiento.length +" valores" );
                    console.log(datosEntrenamiento);   
                    enRedNeural();
                    eCompleto=true;
                    player.position.x = 400;
                    restart();

                }
                modoAuto = true;
            }

            menu.destroy();
            restart();
            game.paused = false;

        }
    }
}


function createAliens () {

    for (var y = 0; y < 4; y++){
        for (var x = 0; x < 10; x++){
            var alien = aliens.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
            alien.play('fly');
            alien.body.moves = false;
        }
    }

    aliens.x = 100;
    aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    tween.onLoop.add(descend, this);
}

function setupInvader (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

function descend() {

    aliens.y += 10;

}

function izquierda(){
    //salida = [1, 0];
    if(player.position.x >=60) player.body.velocity.x = -200;
    else player.body.velocity.x = 200;
}

function derecha(){
    //salida = [0, 1];
    if(player.position.x <= 750) player.body.velocity.x = 200;
    else player.body.velocity.x = -200;
}

function update() {

    //  Scroll el background
    

    if (player.alive)
    {
        //  Reseta el jugador, despues checha si hay movimiento
        player.body.velocity.setTo(0, 0);

        
        
        
        
        //c = (playerPos - shooterX);
        //console.log(`Distancia euclidiana: ${c} Pos x jugador: ${playerPos}`);
        salida = [0, 0];
        if (cursors.left.isDown){
            izquierda();
        }else if (cursors.right.isDown){
            derecha();
        }

        //  Dispara?
        if (fireButton.isDown)
        {
            fireBullet();
        }

        if (game.time.now > firingTimer)
        {
            enemyFires();
        }
        if(shooterX > 0 && player.position.x >= shooterX){
            salida = [1,0];
        }else if(shooterX > 0 && player.position.x <= shooterX){
            salida = [0,1];
        }else{
            salida = [0,0];
        }

        if(modoAuto == false && shooterX > 0)
        {
            playerPosX=  player.position.x;
            playerPosY=  player.position.y;
            var a = shooterX - playerPosX;
            var b = shooterY - playerPosY;
            var c = Math.sqrt( (a*a) + (b*b) );
            c = parseInt(c, 10);
            datosEntrenamiento.push({
                input: [shooterX, playerPosX],
                output: salida
            });   
            
        }

        if (modoAuto == true && shooterX > 0){
            playerPosX=  player.position.x;
            playerPosY=  player.position.y;
            var a = shooterX - playerPosX;
            var b = shooterY - playerPosY;
            var c = Math.sqrt( (a*a) + (b*b) );
            c = parseInt(c, 10);
            var salidata = datosDeEntrenamiento([shooterX, playerPosX]);
            fireBullet();
            if(salidata) izquierda();
            else derecha();
           /*  if( datosDeEntrenamiento( [c, shooterX] )  ){
                shooterX = 0;
                player.body.velocity.x = 200;
                fireBullet();
            }else{
                
                player.body.velocity.x = -200;
                fireBullet();
            } */
        }

        //  Corre una colision
        game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
        game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);
    }

}

function render() {

    // for (var i = 0; i < aliens.length; i++)
    // {
    //     game.debug.body(aliens.children[i]);
    // }

}

function collisionHandler (bullet, alien) {

    //  Cuando la bala golpea a un alien, matamos la bala y el alien
    bullet.kill();
    alien.kill();

    //  Incrementa el score
    score += 20;
    scoreText.text = scoreString + score;

    //  Crea una explosion
    var explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);

    if (aliens.countLiving() == 0)
    {
        score += 1000;
        scoreText.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        stateText.text = " You Won, \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyHitsPlayer (player,bullet) {
    
    bullet.kill();

    live = lives.getFirstAlive();

    if (live)
    {
        live.kill();
    }

    //  Crea una explosion
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play('kaboom', 30, false, true);

    // Cuando el jugador muere
    if (lives.countLiving() < 1)
    {
        player.kill();
        enemyBullets.callAll('kill');

        stateText.text=" GAME OVER \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyFires () {

    //  Agarra la primera bala que podamos de la piscina
    enemyBullet = enemyBullets.getFirstExists(false);
    

    livingEnemies.length=0;
    

    aliens.forEachAlive(function(alien){

        // pone los enemigos vivos en un array
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0){
        shooterX = enemyBullet.position.x;
        shooterY = enemyBullet.position.y;
        var random=game.rnd.integerInRange(0,livingEnemies.length-1);
        // selecciona aleatoriamente a un enemigo
        shooter=livingEnemies[random];
        // Dispara un bala de ese enemigo
        enemyBullet.reset(shooter.body.x, shooter.body.y);
        
        objetivo = game.physics.arcade.moveToObject(enemyBullet,player,120);
        
        firingTimer = game.time.now + 2000;
    }

}

function fireBullet () {

    //  Para evitar que se les permita disparar demasiado rápido, establecemos un límite de tiempo.
    if (game.time.now > bulletTime)
    {
        //  Agarra la primera bala que podamos de la piscina
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            //  la dispara
            bullet.reset(player.x, player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = game.time.now + 200;
        }
    }

}

function resetBullet (bullet) {
    //  Es llamado si la bala se sale de la pantalla
    bullet.kill();
}



function restart () {
    //  Un nuevo nivel empieza
    
    //Resetea el contador de vidas
    lives.callAll('revive');
    //  Regresa a los aliens de la muerte
    aliens.removeAll();
    createAliens();

    //revive al jugador
    player.revive();
    //Oculta el texto
    stateText.visible = false;
}
