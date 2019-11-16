let flippyBird = (function () {
    let c = document.getElementById("flippy-bird-canvas");
    c.height = c.clientHeight;
    c.width = c.clientWidth;
    let context = c.getContext("2d");
    let lastUpdate = Date.now();
    let now = lastUpdate;
    let deltaT;
    let scale = 1;
    let gravAcc = 18;
    let obstacles = new Array();
    let passed_obstacles = 0;
    return {
      c: c,


      begin: function () {
        console.log("Begin game");
        setInterval(() => {obstacles.push(flippyBird.Obstacle());},5000);
        flippyBird.loop();
      },


      resize: function () {
        c.height = c.clientHeight;
        c.width = c.clientWidth;
      },


      draw: function () {
        context.clearRect(0, 0, c.width, c.height)
        context.font = "30px Arial";
        context.fillStyle = "black";
        context.fillText("Flippy Bird", 10*scale, 50*scale);
        flippyBird.bird.draw();
        obstacles.forEach(x => x.draw());
        requestAnimationFrame(flippyBird.loop);
      },


      loop: function() {
        now = Date.now();
        deltaT = (now - lastUpdate)*0.001;
        lastUpdate = now;
        if ( obstacles.length > 0 && obstacles[0].x() < -200){
          obstacles.shift();
          passed_obstacles += 1;
        }

        flippyBird.bird.gravity();
        flippyBird.bird.collision();
        flippyBird.draw();
      },


      bird: (function () {
        let x = c.width / 3.0;
        let y = c.height / 2.0;
        let velocity = {x: 0, y: 0};
        let size = 20;
        let offset = size / 2;
        return {
          draw: function (){
            x += velocity.x;
            y += velocity.y;
            context.fillStyle = "grey";
            context.fillRect(x - offset * scale, y - offset * scale, size * scale, size * scale);
          },
          gravity: function (){
            velocity.y += gravAcc * deltaT;
          },
          collision: function (){
            if (y > c.height-offset*scale && velocity.y > 0){
              velocity.y *= -0.2;
              y = c.height-offset*scale;
            }
          },
          jump: function(){
            if (velocity.y > 0) 
              velocity.y *= 0.75;
            velocity.y -= 0.8*gravAcc;
            if (velocity.y < 0.5*gravAcc) 
              velocity.y= -0.5*gravAcc;
          }
        }
      }()),


      Obstacle: function() {
        const width = 200;
        let height = 3000;
        let x = c.width;
        let space = 200;
        let y = (Math.random()*(c.height-space-10)) + 5;
        let velocity = {x: -2 - 0.1*passed_obstacles, y: 0};
        return{
          draw: function(){
            x += velocity.x;
            y += velocity.y;
            context.fillStyle = "green";
            context.fillRect(x, y, width, y - height);
            context.fillRect(x, y+space , width, y + height);
          },
          x: () => {return x+width/2;},
          width: width
        }
      }
    };
  }());

flippyBird.c.addEventListener("mousedown",flippyBird.bird.jump);
flippyBird.begin();