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
    c.removeEventListener("mousedown",flippyBird.begin);
    c.addEventListener("mousedown",flippyBird.jump);
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
      cancelAnimationFrame(loop);
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
    let size = 40;
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
        ctx.fillStyle = "rgb(" + Math.floor(150 * (velocity.rot/-0.30) -50) + ", 0,0)";
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
        obstacles.forEach(obs => {
          let box = {x1: x-offset, y1: y-offset, x2: x+offset, y2: y+offset};
          let box1 = obs.box1();
          let box2 = obs.box2();
          if (!(box1.x1 >= box.x2 
                || box1.x2 <= box.x1
                || box1.y1 >= box.y2
                || box1.y2 <= box.y1)
              || !(box2.x1 >= box.x2 
                  || box2.x2 <= box.x1
                  || box2.y1 >= box.y2
                  || box2.y2 <= box.y1)){
              end();
            }
        })
      },
      jump: function(){
        if (velocity.y > 0) {
          velocity.y *= 0.75;
        } 
        velocity.y -= 0.65*gravAcc;
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
      box1: function () {
          return {
            x1: x, 
            y1: y - height, 
            x2: x + width, 
            y2: y
          };
        },
      box2: function () {
        return {
          x1: x, 
          y1: y + space,  
          x2: x + width, 
          y2: y + height};
      }
    };
  }


  function end () {
    clearTimeout(pushee);
    c.removeEventListener("mousedown",flippyBird.jump);
    c.addEventListener("mousedown",flippyBird.begin);
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

flippyBird.begin();