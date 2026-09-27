import { vertex, fragment } from './shaders.js';

export async function createJourneyCanvas(hero, pull) {
  await document.fonts.ready;
  const portrait = hero.querySelector('.hero-image');
  await portrait.decode();
  const canvas = document.createElement('canvas');
  canvas.className = 'journey-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL unavailable');
  const resources = [];
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message);
    }
    resources.push(() => gl.deleteShader(shader)); return shader;
  };
  try {
    const program = gl.createProgram();
    resources.push(() => gl.deleteProgram(program));
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer(); resources.push(() => gl.deleteBuffer(buffer));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {};
    for (const name of ['Time','Gravity','EventHorizon','Suction','Fisheye','Chromatic','Glitch','Impact','Formation','Camera','Pull','Resolution','Center']) uniforms[name] = gl.getUniformLocation(program, 'u'+name);
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = innerWidth, height = innerHeight;
    canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    const layer = (draw, unit, name) => {
      const source = document.createElement('canvas'); source.width=canvas.width; source.height=canvas.height;
      const ctx=source.getContext('2d'); ctx.scale(ratio,ratio); draw(ctx);
      const texture=gl.createTexture(); resources.push(() => gl.deleteTexture(texture));
      gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      gl.uniform1i(gl.getUniformLocation(program,name),unit);
    };
    layer(ctx => {
      for (const glyph of hero.querySelectorAll('.glyph')) {
        const rect=glyph.getBoundingClientRect(), css=getComputedStyle(glyph);
        ctx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        ctx.fillStyle=css.color; ctx.textAlign='center';
        const m=ctx.measureText(glyph.textContent);
        // DOM line box baseline from font ascent/descent, preserving fixed slots.
        const ascent=m.fontBoundingBoxAscent ?? parseFloat(css.fontSize)*.8;
        const descent=m.fontBoundingBoxDescent ?? parseFloat(css.fontSize)*.2;
        const baseline=rect.top+pull+(rect.height-ascent-descent)/2+ascent;
        ctx.fillText(glyph.textContent,rect.left+rect.width/2,baseline);
      }
    },0,'uType');
    layer(ctx => {
      const box=portrait.getBoundingClientRect();
      const scale=Math.min(box.width/portrait.naturalWidth,box.height/portrait.naturalHeight);
      const w=portrait.naturalWidth*scale,h=portrait.naturalHeight*scale;
      ctx.shadowColor='rgba(0,0,0,.6)'; ctx.shadowBlur=40; ctx.shadowOffsetY=14;
      ctx.drawImage(portrait,box.left+(box.width-w)/2,box.bottom+pull-h,w,h);
    },1,'uPortrait');
    gl.uniform2f(uniforms.Resolution,width,height);
    gl.uniform2f(uniforms.Center,.52,.52);
    document.body.append(canvas);
    return {
      canvas,
      render(values) { for(const key in values) gl.uniform1f(uniforms[key],values[key]); gl.drawArrays(gl.TRIANGLES,0,6); },
      dispose() { resources.reverse().forEach(dispose=>dispose()); canvas.remove(); },
    };
  } catch(error) { resources.reverse().forEach(dispose=>dispose()); throw error; }
}
