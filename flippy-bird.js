let flippyBird = (function () {
    let c = document.getElementById("flippy-bird-canvas");
    c.height = c.clientHeight;
    c.width = c.clientWidth;
    let context = c.getContext("2d");
    return {
      c: c,
      begin: function () {
        console.log("Begin game");
        this.loop();
      },
      resize: function () {
        c.height = c.clientHeight;
        c.width = c.clientWidth;
      },
      draw: function () {
        context.font = "30px Arial";
        context.fillText("Flippy Bird", 10, 50);
        requestAnimationFrame(flippyBird.loop);
      },
      loop: function() {
        context.clearRect(0, 0, c.width, c.height)
        flippyBird.draw();
      }
    };
  }());

flippyBird.begin();