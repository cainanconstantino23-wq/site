/*
 * Gradiente animado (WebGL2), sem React.
 * Adaptado do componente "Animated Gradient" da Spell UI: https://spell.sh/docs/animated-gradient
 * O shader é o original; o resto foi reescrito em JavaScript simples para o painel (HTML estático).
 *
 * Uso:
 *   const g = GradienteAnimado(elemento, { color1:'#0C2C6B', color2:'#34549F', color3:'#ECE3D3', swirl:65 });
 *   g.config({ speed: 10 });   // muda opções sem recriar
 *   g.parar();                 // remove o canvas e libera a GPU
 *
 * O elemento precisa ter position:relative (ou absolute/fixed) e altura. O canvas fica atrás do conteúdo (z-index:-1),
 * então o elemento também precisa criar um contexto de empilhamento (isolation:isolate).
 * Com "reduzir movimento" ligado, desenha um quadro só, parado. Fora da tela ou com a aba escondida, pausa.
 */
(function (global) {
  'use strict';

  var FORMAS = { Checks: 0, Stripes: 1, Edge: 2 };
  var PADRAO = { rotation: 0, proportion: 35, scale: 1, speed: 25, distortion: 12, swirl: 80, swirlIterations: 10, softness: 100, offset: 0, shape: 'Checks', shapeSize: 10 };

  var VERTEX = '#version 300 es\nin vec4 a_position;\nvoid main() { gl_Position = a_position; }';
  var FRAGMENT = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
    vec3 color1 = c1.rgb * c1.a;
    vec3 color2 = c2.rgb * c2.a;
    vec3 color3 = c3.rgb * c3.a;

    float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
    float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

    vec3 blended_color_2 = mix(color1, color2, r1);
    float blended_opacity_2 = mix(c1.a, c2.a, r1);

    vec3 c = mix(blended_color_2, color3, r2);
    float o = mix(blended_opacity_2, c3.a, r2);
    return vec4(c, o);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float t = .5 * u_time;

    float noise_scale = .0005 + .006 * u_scale;

    uv -= .5;
    uv *= (noise_scale * u_resolution);
    uv = rotate(uv, u_rotation * .5 * PI);
    uv /= u_pixelRatio;
    uv += .5;

    float n1 = noise(uv * 1. + t);
    float n2 = noise(uv * 2. - t);
    float angle = n1 * TWO_PI;
    uv.x += 4. * u_distortion * n2 * cos(angle);
    uv.y += 4. * u_distortion * n2 * sin(angle);

    float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
    for (float i = 1.; i <= iterations_number; i++) {
        uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
        uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
    }

    float proportion = clamp(u_proportion, 0., 1.);

    float shape = 0.;
    float mixer = 0.;
    if (u_shape < .5) {
      vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
      shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else if (u_shape < 1.5) {
      vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
      float f = fract(stripes_shape_uv.y);
      shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else {
      float sh = 1. - uv.y;
      sh -= .5;
      sh /= (noise_scale * u_resolution.y);
      sh += .5;
      float shape_scaling = .2 * (1. - u_shapeScale);
      shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
      mixer = shape;
    }

    vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

    fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;

  function cor(v) {
    var r = 0, g = 0, b = 0, a = 1, s = String(v).trim(), p;
    if (s.indexOf('rgb') === 0) {
      p = s.slice(s.indexOf('(') + 1, -1).split(',');
      r = parseInt(p[0], 10) / 255; g = parseInt(p[1], 10) / 255; b = parseInt(p[2], 10) / 255; if (p[3] != null) a = parseFloat(p[3]);
    } else if (s.indexOf('hsl') === 0) {
      p = s.slice(s.indexOf('(') + 1, -1).split(',');
      var h = parseFloat(p[0]) / 360, sa = parseFloat(p[1]) / 100, l = parseFloat(p[2]) / 100;
      if (p[3] != null) a = parseFloat(p[3]);
      if (sa === 0) { r = g = b = l; } else {
        var q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, pp = 2 * l - q;
        var f = function (t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return pp + (q - pp) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return pp + (q - pp) * (2 / 3 - t) * 6; return pp; };
        r = f(h + 1 / 3); g = f(h); b = f(h - 1 / 3);
      }
    } else if (s[0] === '#') {
      var c = s.slice(1);
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      r = parseInt(c.slice(0, 2), 16) / 255; g = parseInt(c.slice(2, 4), 16) / 255; b = parseInt(c.slice(4, 6), 16) / 255;
      if (c.length === 8) a = parseInt(c.slice(6, 8), 16) / 255;
    }
    return [r, g, b, a];
  }

  function GradienteAnimado(el, opcoes) {
    var P = Object.assign({}, PADRAO, opcoes || {});
    var caixa = document.createElement('div');
    caixa.setAttribute('aria-hidden', 'true');
    caixa.style.cssText = 'position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;border-radius:inherit';
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    caixa.appendChild(canvas);
    el.appendChild(caixa);

    var gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return { config: function () {}, parar: function () { caixa.remove(); }, ok: false };

    function shader(tipo, fonte) { var s = gl.createShader(tipo); gl.shaderSource(s, fonte); gl.compileShader(s); return s; }
    var vs = shader(gl.VERTEX_SHADER, VERTEX), fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['u_time', 'u_resolution', 'u_pixelRatio', 'u_scale', 'u_rotation', 'u_color1', 'u_color2', 'u_color3', 'u_proportion', 'u_softness', 'u_shape', 'u_shapeScale', 'u_distortion', 'u_swirl', 'u_swirlIterations']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    function medir() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(el.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(el.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (parado) desenhar(0);
    }

    var t0 = performance.now(), quadro = null, visivel = true, vivo = true;
    var parado = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function desenhar(seg) {
      var c1 = cor(P.color1), c2 = cor(P.color2), c3 = cor(P.color3);
      gl.uniform1f(U.u_time, seg * (P.speed / 100) * 5 + P.offset * 0.01);
      gl.uniform2f(U.u_resolution, canvas.width, canvas.height);
      gl.uniform1f(U.u_pixelRatio, Math.min(global.devicePixelRatio || 1, 2));
      gl.uniform1f(U.u_scale, P.scale);
      gl.uniform1f(U.u_rotation, P.rotation * Math.PI / 180);
      gl.uniform4f(U.u_color1, c1[0], c1[1], c1[2], c1[3]);
      gl.uniform4f(U.u_color2, c2[0], c2[1], c2[2], c2[3]);
      gl.uniform4f(U.u_color3, c3[0], c3[1], c3[2], c3[3]);
      gl.uniform1f(U.u_proportion, P.proportion / 100);
      gl.uniform1f(U.u_softness, P.softness / 100);
      gl.uniform1f(U.u_shape, FORMAS[P.shape] || 0);
      gl.uniform1f(U.u_shapeScale, P.shapeSize / 100);
      gl.uniform1f(U.u_distortion, P.distortion / 50);
      gl.uniform1f(U.u_swirl, P.swirl / 100);
      gl.uniform1f(U.u_swirlIterations, P.swirl === 0 ? 0 : P.swirlIterations);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function laco(agora) {
      quadro = null;
      if (!vivo || parado || !visivel || document.hidden) return;
      desenhar((agora - t0) / 1000);
      quadro = requestAnimationFrame(laco);
    }
    function retomar() { if (vivo && !parado && visivel && !document.hidden && quadro == null) quadro = requestAnimationFrame(laco); }

    var ro = new ResizeObserver(medir); ro.observe(el);
    var io = 'IntersectionObserver' in global ? new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; retomar(); }) : null;
    if (io) io.observe(el);
    document.addEventListener('visibilitychange', retomar);
    medir();
    if (parado) desenhar(0); else retomar();

    return {
      ok: true,
      config: function (novas) { Object.assign(P, novas || {}); if (parado) desenhar(0); },
      parar: function () {
        vivo = false;
        if (quadro != null) cancelAnimationFrame(quadro);
        ro.disconnect(); if (io) io.disconnect();
        document.removeEventListener('visibilitychange', retomar);
        gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf);
        caixa.remove();
      }
    };
  }

  global.GradienteAnimado = GradienteAnimado;
})(window);
