const updateControllersValues = index => {
  const ranges = {
    bass: {
      min: 0,
      max: 50
    },
    "bug-FIXME": {
      min: 50,
      max: 100
    },
    tenor: {
      min: 100,
      max: 150
    },
    alto: {
      min: 150,
      max: 200
    },
    soprano: {
      min: 200,
      max: 255
    },
    all: {
      min: 0,
      max: 255
    }
  };

  const range =
    document.getElementsByClassName(`controller__select-range-${index}`)[0]
      .value || "all";
  const frequencyMin = ranges[range].min;
  const frequencyMax = ranges[range].max;

  // Get user input
  const rotationSpeed = document.getElementsByClassName(
    `controller__slider-rotationSpeed-${index}`
  )[0].value;

  const size = document.getElementsByClassName(
    `controller__slider-size-${index}`
  )[0].value;

  const twist = document.getElementsByClassName(
    `controller__slider-twist-${index}`
  )[0].checked;

  const stroke = document.getElementsByClassName(
    `controller__slider-stroke-${index}`
  )[0].checked;

  const clear = document.getElementsByClassName(
    `controller__slider-clear-${index}`
  )[0].checked;

  let colorWell = hexToRGB(
    document
      .getElementsByClassName(`controller__slider-color-${index}`)[0]
      .value.replace("#", "0x")
  );

  let opacity = document.getElementsByClassName(
    `controller__slider-opacity-${index}`
  )[0].value;
  return {
    frequencyMin,
    frequencyMax,
    rotationSpeed,
    size,
    colorWell,
    opacity,
    twist,
    stroke,
    clear
  };
};

function startAudioVisual() {
  "use strict";
  const angles = {};

  const soundAllowed = function(stream) {
    //Audio stops listening in FF without // window.persistAudioStream = stream;
    //https://bugzilla.mozilla.org/show_bug.cgi?id=965483
    //https://support.mozilla.org/en-US/questions/984179
    window.persistAudioStream = stream;
    const audioContent = new AudioContext();
    const audioStream = audioContent.createMediaStreamSource(stream);
    const analyser = audioContent.createAnalyser();
    audioStream.connect(analyser);
    analyser.fftSize = 1024;

    const frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    var doDraw = function() {
      requestAnimationFrame(doDraw);
      analyser.getByteFrequencyData(frequencyArray);
      let volume;

      const canvasses = Array.prototype.slice.apply(
        document.querySelectorAll("canvas")
      );

      // For each canvas do a drawing
      if (canvasses.length >= 1) {
        canvasses.map((canvas, index) => {
          index++
          index = document.getElementsByClassName(`controller__select-canvas-${index}`)[0].value;
          const canvasContext = canvas.getContext("2d");

          let {
            frequencyMin,
            frequencyMax,
            rotationSpeed,
            size,
            colorWell,
            opacity,
            twist,
            stroke,
            clear
          } = updateControllersValues(index);

          clear && canvasContext.clearRect(0, 0, canvas.width, canvas.height);

          rotate({
            ctx: canvasContext,
            x: canvas.width / 2,
            y: canvas.height / 2,
            degree: angles[`canvas${index}`],
            drawShape: () => {
              // For each frequency draw something
              for (let i = frequencyMin; i < frequencyMax; i++) {
                volume =
                  Math.floor(frequencyArray[i]) -
                  (Math.floor(frequencyArray[i]) % 5);

                updateOpacity(index);
                let customColor2 = `rgb(
          ${colorWell.r - volume},
          ${colorWell.g - volume},
          ${colorWell.b - volume},
          ${opacity / 100})`;
                let customColor = `rgb(
          ${colorWell.r + volume},
          ${colorWell.g + volume},
          ${colorWell.b + volume},
          ${opacity / 100})`;

                canvasContext.fillStyle = customColor2;

                pattern({
                  ctx: canvasContext,
                  canvas: canvas,
                  radius: (volume / 5) * size,
                  width: (volume / 5) * size,
                  volume,
                  i,
                  mode:
                    document.getElementsByClassName(
                      `controller__select-pattern-${index}`
                    )[0].value || "circle",
                  twist,
                  shape: (x, y) =>
                    drawShape({
                      x: x,
                      y: y,
                      ctx: canvasContext,
                      width: (volume / 5) * size,
                      mode:
                        document.getElementsByClassName(
                          `controller__select-shape-${index}`
                        )[0].value || "circle",
                      i,
                      style: customColor,
                      stroke: stroke
                    })
                });
              }
            }
          });
          if (angles[`canvas${index}`] >= 360) {
            angles[`canvas${index}`] = 0;
          }

          if (angles[`canvas${index}`]) {
            angles[`canvas${index}`] += (volume * rotationSpeed) / 10000;
          } else {
            angles[`canvas${index}`] = 0.1;
          }

          canvasContext.globalCompositeOperation = document.getElementsByClassName(
            `controller__select-effect-${index}`
          )[0].value;
        });
      }
    };

    doDraw();
  };

  const soundNotAllowed = function(error) {
    console.log(error);
  };

  /*window.navigator = window.navigator || {};
	/*navigator.getUserMedia =  navigator.getUserMedia       ||
														navigator.webkitGetUserMedia ||
														navigator.mozGetUserMedia    ||
														null;*/
  navigator.getUserMedia({ audio: true }, soundAllowed, soundNotAllowed);
}
