export const vertex = `attribute vec2 position; varying vec2 vUv;
void main(){ vUv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;

export const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uType, uPortrait;
uniform vec2 uResolution, uCenter;
uniform float uTime, uGravity, uEventHorizon, uSuction, uFisheye;
uniform float uChromatic, uGlitch, uImpact, uFormation, uCamera, uPull;
float hash(float p){return fract(sin(p*127.1)*43758.5453);}
vec4 sampleLayer(sampler2D image, vec2 uv){
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.);
  return texture2D(image,uv);
}
// Inverse mapping: sampling farther OUT places source pixels farther IN.
// dr_source/dr_screen > 1 gives radial compression with localized stretching.
vec4 attracted(sampler2D image, vec2 p, float mass){
  float r=length(p);
  float field=exp(-r*r*2.1);
  float strength=uSuction*mass;
  // Power-law lens: tangential compression exceeds radial compression,
  // stretching recognizable silhouettes along paths into the horizon.
  float exponent=.82*(1.-exp(-strength*.75));
  vec2 q=p*pow(.82/max(r,.001),exponent)*(1.+strength*.09);
  q*=1.+uFisheye*r*r*.75;
  float tilt=(1.-uFormation)*0.+sin(uTime*.7)*.013*uGravity;
  q=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q;
  float angle=.012*uFormation-.028*uImpact;
  q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
  q/=uCamera;
  q.x+=q.y*(.025*uFormation-.05*uImpact);
  q.y+=q.x*q.x*.035*uGravity;
  float band=floor(vUv.y*65.);
  q.x+=uGlitch*(hash(band+floor(uTime*31.))-.5)*.10;
  vec2 scale=vec2(min(uResolution.x,uResolution.y))/uResolution;
  vec2 uv=uCenter+q*scale;
  uv.y-=uPull/uResolution.y;
  vec2 split=normalize(p+vec2(.0001))*scale*uChromatic*(.25+field);
  vec4 c=sampleLayer(image,uv);
  c.r=sampleLayer(image,uv+split).r;
  c.b=sampleLayer(image,uv-split).b;
  // Faint radial motion trails extend from each source toward the center.
  vec4 trail=vec4(0.);
  for(int i=1;i<=5;i++){
    float k=float(i);
    vec2 t=uCenter+(q*(1.+k*.045*uGravity*mass))*scale;
    t.y-=uPull/uResolution.y;
    vec4 s=sampleLayer(image,t);
    float alpha=s.a*(.10-.012*k)*uGravity;
    trail.rgb+=s.rgb*alpha;
    trail.a+=alpha;
  }
  float combined=c.a+trail.a*(1.-c.a);
  c=vec4((c.rgb*c.a+trail.rgb*(1.-c.a))/max(combined,.001),combined);
  return c;
}
void main(){
  vec2 aspect=uResolution/min(uResolution.x,uResolution.y);
  vec2 p=(vUv-uCenter)*aspect;
  float r=length(p);
  vec4 type=attracted(uType,p,1.);
  vec4 portrait=attracted(uPortrait,p,.48+.52*uImpact);
  vec3 color=vec3(14./255.);
  color=mix(color,type.rgb,type.a);
  color=mix(color,portrait.rgb,portrait.a);
  float radius=uEventHorizon*uCamera;
  float rim=exp(-abs(r-radius)*150./max(.5,uCamera));
  float halo=exp(-abs(r-radius)*24.)*.12;
  color+=vec3(.19,.055,.27)*(rim*.45+halo)*uFormation;
  // Sparse converging dust paths; every point accelerates inward, no waves.
  for(int i=0;i<32;i++){
    float id=float(i);
    float angle=hash(id+3.)*6.28318;
    float cycle=fract(hash(id+20.)-uTime*(.065+uGravity*.18));
    float distance=radius+.035+pow(cycle,1.8)*.85;
    vec2 axis=vec2(cos(angle),sin(angle));
    vec2 delta=p-axis*distance;
    float along=dot(delta,axis);
    float across=dot(delta,vec2(-axis.y,axis.x));
    float streak=exp(-abs(along)/( .003+uGravity*.025)-abs(across)*1100.);
    color+=vec3(.24,.095,.34)*streak*uFormation*cycle;
  }
  float horizon=1.-smoothstep(radius*.91,radius+ .002,r);
  color=mix(color,vec3(.004,.002,.006),horizon*uFormation);
  color+= (hash(dot(gl_FragCoord.xy,vec2(1.,137.))+floor(uTime*24.))-.5)*.008*uGravity;
  gl_FragColor=vec4(color,1.);
}`;
