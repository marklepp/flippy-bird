const flippyBird = (function () {
  let c = document.getElementById("flippy-bird-canvas");
  c.height = c.clientHeight;
  c.width = c.clientWidth;
  let ctx = c.getContext("2d");
  let lastUpdate = Date.now();
  let now = lastUpdate;
  let deltaT;
  let gravAcc = 18;
  let obstacles = new Array();
  let passed_obstacles = 0;
  let pushee;
  let ended = true;
  let bird = Bird();
  let speed = -2 - 0.1*passed_obstacles;


  function begin () {
    console.log("Begin game");
    ended = false;
    obstacles= [];
    passed_obstacles = 0;
    obstacles.push(Obstacle());
    loop();
    pushee = setTimeout(function pusher () {
        obstacles.push(Obstacle());
        clearTimeout(pushee);
        pushee = setTimeout(
          () => {
            pusher() }, 
          Math.random() * (3000/(2 + 0.1*passed_obstacles)) + 10000/(2 + 0.1*passed_obstacles));
      },5000);
  }


  function resize () {
      c.height = c.clientHeight;
      c.width = c.clientWidth;
  }


  function draw () {
    ctx.clearRect(0, 0, c.width, c.height)
    bird.draw();
    obstacles.forEach(x => x.draw());
    ctx.font = "30px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Flippy Bird: " + passed_obstacles, 10, 50);
    if (!ended) {
      requestAnimationFrame(loop);
    }
    else{
      ctx.fillStyle = "black";
      ctx.fillText("Game Over", c.width/2- 20, c.height/2);
    }
  }


  function loop () {
    now = Date.now();
    deltaT = (now - lastUpdate)*0.001;
    lastUpdate = now;
    if ( obstacles.length > 0 && obstacles[0].x() < -200){
      obstacles.shift();
      passed_obstacles += 1;
    }

    bird.physics();
    bird.collision();
    draw();
  }


  function Bird () {
    let x = c.width / 3.0;
    let y = c.height / 2.0;
    let angle = 0;
    let velocity = {x: 0, y: 0, rot: 0};
    let size = 50;
    let offset = size / 2;
    return {
      draw: function (){
        x += velocity.x;
        y += velocity.y;
        angle += velocity.rot;
        angle = (angle < (-2 * Math.PI)) ? angle + (2 * Math.PI) : angle;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = "black";
        ctx.fillRect(-offset , -offset, size, size);
        ctx.fillStyle = "white";
        ctx.fillRect(-0.5*offset, -0.5*offset, 0.25*offset, 0.25*offset)
        ctx.fillRect(0.5*offset, -0.5*offset, 0.25*offset, 0.25*offset)
        ctx.fillStyle = "yellow";
        ctx.fillRect(0, -0.25*offset, 0.25*offset, 0.5*offset)
        ctx.restore()
      },
      physics: function (){
        velocity.y += gravAcc * deltaT;
        velocity.rot *= 0.980;
      },
      collision: function (){
        if (y > c.height-offset && velocity.y > 0){
          velocity.y *= -0.2;
          angle *= 0.9
          y = c.height-offset;
        }
      },
      jump: function(){
        if (velocity.y > 0) {
          velocity.y *= 0.75;
        } 
        velocity.y -= 0.8*gravAcc;
        velocity.rot -= 0.11;
        if (velocity.y < -0.7*gravAcc){
          velocity.y= -0.7*gravAcc;
        }
      }
    };
  }


  function Obstacle () {
    let width = 200;
    let height = 3000;
    let x = c.width;
    let space = 240;
    let y = (Math.random()*(c.height-space-10)) + 5;
    speed = -2 - 0.1*passed_obstacles;
    let velocity = {x: speed, y: 0};
    return{
      draw: function(){
        x += velocity.x;
        y += velocity.y;
        ctx.fillStyle = "green";
        ctx.fillRect(x, y, width, y - height);
        ctx.fillRect(x, y+space , width, y + height);
      },
      x: () => {return x+width/2;},
      width: width
    };
  }


  function end () {
    clearTimeout(pushee);
    ended = true;
  }



  return {
    c: c,
    begin: begin,
    resize: resize,
    jump: bird.jump,
    end: end 
  };
}());

flippyBird.c.addEventListener("mousedown",flippyBird.jump);
flippyBird.begin();