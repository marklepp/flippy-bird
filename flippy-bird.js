let flippyBird = (function () {
    let c = document.getElementById("flippy-bird-canvas");
    c.height = c.clientHeight;
    c.width = c.clientWidth;
    let context = c.getContext("2d");
    let lastUpdate = Date.now();
    let now = lastUpdate;
    let deltaT;
    let scale = 1;
    let gravAcc = 30;
    return {
      c: c,
      begin: function () {
        console.log("Begin game");
        flippyBird.loop();
      },
      resize: function () {
        c.height = c.clientHeight;
        c.width = c.clientWidth;
      },
      draw: function () {
        context.clearRect(0, 0, c.width, c.height)
        context.font = "30px Arial";
        context.fillText("Flippy Bird", 10*scale, 50*scale);
        flippyBird.bird.draw();
        requestAnimationFrame(flippyBird.loop);
      },
      loop: function() {
        now = Date.now();
        deltaT = (now - lastUpdate)*0.001;
        lastUpdate = now;
        flippyBird.bird.gravity();
        flippyBird.bird.collision();
        flippyBird.draw();
      },
      bird: (function () {
        let x = c.width / 2.0;
        let y = c.height / 2.0;
        let velocity = {x: 0, y: 0};
        let size = 20;
        let offset = size / 2;
        return {
          draw: function (){
            x += velocity.x;
            y += velocity.y;
            context.fillRect(x-offset*scale,y-offset*scale,size*scale,size*scale);
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
      }())
    };
  }());

flippyBird.c.addEventListener("mousedown",flippyBird.bird.jump);
flippyBird.begin();