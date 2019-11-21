const flippyBird = (function () {
  let c = document.getElementById("flippy-bird-canvas");
  c.height = c.clientHeight;
  c.width = c.clientWidth;
  let ctx = c.getContext("2d");
  let entity = [];
  let x = [];
  let y = [];
  let angle = [];
  let velocity = [];
  let height = [];
  let width = [];
  let space = [];
  let lastUpdate = Date.now();
  let now = lastUpdate;
  let deltaT;
  let gravAcc = 18;
  let obstacles = [];
  let passed_obstacles = 0;
  let pushee;
  let ended = true;
  let bird = Bird();
  let speed = -2 - 0.1*passed_obstacles;


  function begin () {
    console.log("Begin game");
    c.removeEventListener("mousedown",flippyBird.begin);
    c.addEventListener("mousedown",flippyBird.jump);
    bird.zero();
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

    if (!ended) {
      bird.physics();
      bird.collision();
    }
    draw();
  }


  function Bird () {
    let id = entity.length;
    x[id] = c.width / 3.0;
    y[id] = c.height / 2.0;
    angle[id] = 0;
    velocity[id] = {x: 0, y: 0, a: 0};
    height[id] = 40;
    width[id] = 40;
    let offset = height[id] / 2;
    entity[id] = {
      zero: function(){
        velocity[id] = {x: 0, y: 0, a: 0};
      },
      draw: function (){
        angle[id] = (angle[id] < (-2 * Math.PI)) ? angle[id] + (2 * Math.PI) : angle[id];
        ctx.save();
        ctx.translate(x[id], y[id]);
        ctx.rotate(angle[id]);
        ctx.fillStyle = "rgb(" + Math.floor(150 * (velocity[id].a/-0.30) -50) + ", 0,0)";
        ctx.fillRect(-offset , -offset, width[id], height[id]);
        ctx.fillStyle = "white";
        ctx.fillRect(-0.5*offset, -0.5*offset, 0.25*offset, 0.25*offset)
        ctx.fillRect(0.5*offset, -0.5*offset, 0.25*offset, 0.25*offset)
        ctx.fillStyle = "yellow";
        ctx.fillRect(0, -0.25*offset, 0.25*offset, 0.5*offset)
        ctx.restore()
      },
      physics: function (){
        velocity[id].y += gravAcc * deltaT;
        velocity[id].a *= 0.980;
        x[id] += velocity[id].x;
        y[id] += velocity[id].y;
        angle[id] += velocity[id].a;
        if (velocity[id].y < -0.7*gravAcc){
          velocity[id].y= -0.7*gravAcc;
        }
      },
      collision: function (){
        if (y[id] > c.height-offset && velocity[id].y > 0){
          velocity[id].y *= -0.2;
          angle[id] *= 0.9
          y[id] = c.height-offset;
        }
        obstacles.forEach(obs => {
          let box = {x1: x[id]-offset, y1: y[id]-offset, x2: x[id]+offset, y2: y[id]+offset};
          let box1 = obs.box1();
          let box2 = obs.box2();
          let collides = !(box1.x1 >= box.x2 
                          || box1.x2 <= box.x1
                          || box1.y1 >= box.y2
                          || box1.y2 <= box.y1) ||
                         !(box2.x1 >= box.x2 
                          || box2.x2 <= box.x1
                          || box2.y1 >= box.y2
                          || box2.y2 <= box.y1);
          if (collides) {
              end();
            }
        });
      },
      jump: function(){
        if (velocity[id].y > 0) {
          velocity[id].y *= 0.75;
        } 
        velocity[id].y -= 0.65*gravAcc;
        velocity[id].a -= 0.11;
      }
    };
    return entity[id];
  }


  function Obstacle () {
    let id = entity.length;
    width[id] = 200;
    height[id] = 3000;
    space[id] = 240;
    x[id] = c.width;
    y[id] = (Math.random()*(c.height-space[id]-10)) + 5;
    speed = -2 - 0.1*passed_obstacles;
    velocity[id] = {x: speed, y: 0};
    entity[id] = {
      draw: function(){
        x[id] += velocity[id].x;
        y[id] += velocity[id].y;
        ctx.fillStyle = "green";
        ctx.fillRect(x[id], y[id], width[id], y[id] - height[id]);
        ctx.fillRect(x[id], y[id] + space[id] , width[id], y[id] + height[id]);
      },
      x: () => {return x[id] + width[id]/2;},
      box1: function () {
          return {
            x1: x[id], 
            y1: y[id] - height[id], 
            x2: x[id] + width[id], 
            y2: y[id]
          };
        },
      box2: function () {
        return {
          x1: x[id], 
          y1: y[id] + space[id],  
          x2: x[id] + width[id], 
          y2: y[id] + height[id]};
      }
    };
    return entity[id];
  }


  function end () {
    clearTimeout(pushee);
    c.removeEventListener("mousedown",flippyBird.jump);
    c.addEventListener("mousedown",flippyBird.begin);
    bird.zero();
    ended = true;
  }



  return {
    c: c,
    entity:() => {return entity;},
    begin: begin,
    resize: resize,
    jump: bird.jump,
    end: end 
  };
}());

flippyBird.begin();