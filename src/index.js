var createContext = require('webgl-context'),
    createShader = require('gl-shader'),
    createBuffer = require('gl-buffer'),
    createVAO = require('gl-vao'),
    touch = require('touches');

function init() {
    var canvas = document.getElementById('canvas'),
        fragmentShaderSource = document.getElementById('fragmentshader').innerHTML,
        vertexShaderSource = document.getElementById('vertexshader').innerHTML;

    var gl = createContext({
        canvas: canvas
    });

    var shader = createShader(gl, vertexShaderSource, fragmentShaderSource);

    var buffer = createBuffer(gl, new Float32Array([-1, -1, -1, 4, 4, -1]));

    var vao = createVAO(gl, [
        {
            buffer: buffer,
            type: gl.FLOAT,
            size: 2
        }
    ]);

    var needUpdate = true;

    var options = {
        quality: 1.,
        actualQuality: 1.,
        scale: 1.,
        distortion: 1.,
        seaLevel: 0.45,
        moveX: 0,
        moveY : 0,
        debug: ''
    };

    /* EVENTS */

    var down = false,
        downPosition = [0,0],
        currentPosition = [0,0];

    var touchEvents = touch(window, { target: canvas, filtered: true });

    touchEvents.on('start', function (e, position) {
        if (!e.ctrlKey && !e.metaKey) {
            if (!down) {
                down = true;
                downPosition[0] = currentPosition[0] = position[0];
                downPosition[1] = currentPosition[1] = position[1];
            }
        }
    });

    touchEvents.on('move', function (e, position) {
        if (down) {
            currentPosition[0] = position[0];
            currentPosition[1] = position[1];
            needUpdate = true;
        }
    });

    touchEvents.on('end', function (e, position) {
        down = false;
        needUpdate = true;
        downPosition[0] = downPosition[1] = currentPosition[0] = currentPosition[1] = 0;
    });

    window.addEventListener('resize', function () { needUpdate = true; }, false);
    window.addEventListener('wheel', function (e) {
        e.preventDefault();
        options.scale = Math.max(0.25, Math.min(5, options.scale + e.deltaY / 200));
        needUpdate = true;
    }, false);

    /* RENDERING */

    function resize(options) {
        var quality = options.actualQuality;
        canvas.style.webkitTransform = canvas.style.transform = 'scale3d(' + quality + ', ' + quality + ', 1)';
        canvas.width = Math.ceil(document.body.clientWidth / quality);
        canvas.height = Math.ceil(document.body.clientHeight / quality);
    }

    console.log(shader);

    function drawScene() {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.bind();

        shader.uniforms.iScale = options.scale * options.actualQuality;
        shader.uniforms.iDistortion = options.distortion;
        shader.uniforms.iSeaLevel = options.seaLevel;
        shader.uniforms.iMove = [options.moveX, options.moveY];

        vao.bind();
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        vao.unbind();
    }

    var previousTime = 0;

    function render(time) {
        time = time || 0;

        var deltaTime = time - previousTime;

        if (needUpdate) {
            options.moveX += (currentPosition[0] - downPosition[0]) / 60 * deltaTime;
            options.moveY += (downPosition[1] - currentPosition[1]) / 60 * deltaTime;
            options.actualQuality = down ? Math.max(3, options.quality) : options.quality;

            resize(options);
            drawScene(options);
            needUpdate = !!down;
        }

        previousTime = time;

        requestAnimationFrame(render);
    }

    render();

    var gui = new dat.GUI(),
        controllers = [];

    controllers.push(gui.add(options, 'quality', { High: 0.5, Good: 1, Medium: 2, Bad: 5 }));
    controllers.push(gui.add(options, 'scale').min(0.25).max(5).step(0.01).listen());
    controllers.push(gui.add(options, 'distortion').min(0.).max(3).step(0.01));
    controllers.push(gui.add(options, 'seaLevel').min(0.3).max(0.6).step(0.01));
    controllers.push(gui.add(options, 'moveX').listen());
    controllers.push(gui.add(options, 'moveY').listen());

    controllers.forEach(function (controller) {
        controller.onChange(function () {
            needUpdate = true;
        });

        controller.onFinishChange(function () {
            needUpdate = true;
        });
    });
}


init();
