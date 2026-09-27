import './journey.css';
import { createJourneyCanvas } from './canvas.js';

const clamp = (v, a=0, b=1) => Math.max(a,Math.min(b,v));
const smooth = v => { v=clamp(v); return v*v*(3-2*v); };
const routes = { IDLE:['PULLING'], PULLING:['IDLE','ARMED'], ARMED:['FORMATION'], FORMATION:['SUCTION','COMPLETE'], SUCTION:['IMPACT','COMPLETE'], IMPACT:['COMPLETE'], COMPLETE:[] };

export function createJourneyTransition(hero, { onComplete = () => {}, motionPreference = matchMedia('(prefers-reduced-motion: reduce)') } = {}) {
  let state='IDLE', amount=0, position=0, velocity=0, raf=0, releaseTimer=0;
  let lastFrame=0, released=false, revealStart=0, lastWheel=0, boundaryReady=true;
  let touchY=null, touchBottom=false, renderer=null, destroyed=false;
  const reduced=motionPreference;
  const original={ transform:hero.style.transform, visibility:hero.style.visibility, opacity:hero.style.opacity, hidden:hero.hidden, inert:hero.inert, overflow:document.body.style.overflow };
  const inspectTime=import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('journeyFrame') ?? NaN) : NaN;
  let animations=[];
  const invitation=document.createElement('button');
  invitation.className='journey-invitation'; invitation.type='button';
  invitation.setAttribute('aria-label','Start journey'); invitation.textContent='START JOURNEY';
  document.body.append(invitation);
  const controller=new AbortController();
  const listen=(target,name,fn,options={})=>target.addEventListener(name,fn,{...options,signal:controller.signal});
  const locked=()=>!['IDLE','PULLING'].includes(state);
  const bottom=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-2;
  function setState(next) {
    if(!routes[state].includes(next)) throw new Error(`Illegal journey state: ${state} → ${next}`);
    state=next;
    document.documentElement.dataset.journeyState=state;
  }
  function paint(now) {
    hero.style.transform=`translate3d(0,${-position}px,0)`;
    const p=clamp(position/150);
    invitation.style.setProperty('--reveal',smooth((p-.07)/.6));
    invitation.style.setProperty('--blur',`${10*(1-smooth(p/.65))}px`);
    invitation.style.setProperty('--tracking',`${.15+.07*p}em`);
    invitation.style.setProperty('--lift',`${Math.max(0,position/2-15)}px`);
    if(p>.1 && !revealStart) revealStart=now;
    if(revealStart && now-revealStart<260 && !reduced.matches) {
      const symbols='_@/+-><?[]{}:$%&!';
      const count=Math.floor((now-revealStart)/260*13);
      invitation.textContent=[...'START JOURNEY'].map((c,i)=>c===' '||i<count?c:symbols[(Math.floor(now/65)+i*7)%symbols.length]).join('');
    } else invitation.textContent='START JOURNEY';
  }
  function tick(now) {
    const dt=Math.min((now-(lastFrame||now-16))/1000,.032); lastFrame=now;
    const target=released?0:150*(1-Math.exp(-amount/310));
    velocity+=(target-position)*240*dt;
    velocity*=Math.exp(-24*dt); position+=velocity*dt;
    paint(now);
    if(released && Math.abs(position)<.15 && Math.abs(velocity)<1) {
      position=0; amount=0; velocity=0; revealStart=0; paint(now); hero.style.transform=original.transform;
      if(state==='PULLING')setState('IDLE'); raf=0; return;
    }
    if(!locked())raf=requestAnimationFrame(tick);
  }
  function ensureTick(){ if(!raf){lastFrame=0;raf=requestAnimationFrame(tick);} }
  function release(){ if(state!=='PULLING')return; released=true; amount=0; ensureTick(); }
  function pull(delta) {
    if(locked())return;
    if(state==='IDLE')setState('PULLING');
    released=false; amount=Math.max(0,amount+delta); ensureTick();
    if(1-Math.exp(-amount/310)>=.75)activate();
  }
  async function activate(){
    if(state!=='PULLING')return;
    setState('ARMED'); clearTimeout(releaseTimer); cancelAnimationFrame(raf); raf=0;
    window.dispatchEvent(new CustomEvent('journey:armed'));
    invitation.textContent='START JOURNEY'; invitation.style.setProperty('--blur','0px');
    invitation.style.setProperty('--reveal','1'); invitation.classList.add('is-armed');
    hero.inert=true; document.body.style.overflow='hidden';
    // Freeze the existing entry at its current visual pose during texture capture.
    animations=hero.getAnimations({subtree:true}); animations.forEach(a=>a.pause());
    try {
      if(!reduced.matches)renderer=await createJourneyCanvas(hero,position);
    } catch(error) { console.warn('Journey uses controlled fade:',error); }
    if(destroyed){renderer?.dispose();return;}
    setState('FORMATION');
    invitation.classList.add('is-leaving');
    const values={Time:0,Gravity:0,EventHorizon:.002,Suction:0,Fisheye:0,Chromatic:0,Glitch:0,Impact:0,Formation:0,Camera:1,Pull:position,Blackout:0};
    if(renderer){renderer.render(values);hero.style.visibility='hidden';}
    const start=performance.now(); let hiddenAt=0, pauseDuration=0;
    function cinematic(now){
      if(document.hidden){ if(!hiddenAt)hiddenAt=now; raf=requestAnimationFrame(cinematic);return; }
      if(hiddenAt){pauseDuration+=now-hiddenAt;hiddenAt=0;}
      const t=Number.isFinite(inspectTime)?clamp(inspectTime,0,4.39):(now-start-pauseDuration)/1000;
      if(!renderer || reduced.matches){
        hero.style.opacity=String(1-clamp(t/.35));
        if(renderer)renderer.canvas.style.opacity=String(1-clamp(t/.35));
        if(t>=.35){complete();return;}
      } else {
        if(t>=1.05 && state==='FORMATION')setState('SUCTION');
        if(t>=3.85 && state==='SUCTION')setState('IMPACT');
        if(t>=4.4){complete();return;}
        const force=smooth((t-1.05)/2.95), impact=smooth((t-3.5)/.9);
        values.Time=t; values.Formation=smooth(t/.95);
        values.Gravity=force; values.Suction=force*force*2.8+impact*7.;
        values.EventHorizon=.002+.052*smooth(t/1.05)+.06*force;
        values.Camera=1-.10*smooth(t/1.05)+Math.pow(impact,4)*25;
        values.Fisheye=force*.6+impact*2;
        values.Chromatic=Math.pow(force,3)*.008+impact*.017;
        const burst=(Math.floor(t*23)%11===0 || (impact>.5&&Math.floor(t*31)%5===0));
        values.Glitch=t>2.8&&burst?force*.8:0;
        values.Impact=impact; values.Pull=position*(1-smooth(t/1.05));
        // Seamless handoff: fade entire frame to #0E0E0E in last 0.5s before complete()
        values.Blackout=smooth(clamp((t-3.9)/0.5));
        renderer.render(values);
      }
      raf=requestAnimationFrame(cinematic);
    }
    raf=requestAnimationFrame(cinematic);
  }
  function complete(){
    setState('COMPLETE'); cancelAnimationFrame(raf); clearTimeout(releaseTimer);
    animations.forEach(a=>a.cancel());
    hero.hidden=true; hero.style.visibility='hidden'; invitation.remove();
    // Set body background to solid black immediately so it shows through any canvas fade
    document.body.style.background='#0E0E0E'; document.body.style.overflow='hidden';
    controller.abort(); window.dispatchEvent(new CustomEvent('journey:complete'));
    if(renderer){
      // Fade canvas to black smoothly over ~300ms before disposing
      const c=renderer.canvas;
      c.style.transition='opacity 320ms ease-in';
      c.style.opacity='0';
      const onDone=()=>{ renderer?.dispose(); renderer=null; onComplete(); };
      c.addEventListener('transitionend', onDone, { once:true });
      // Safety fallback in case transitionend doesn't fire
      setTimeout(()=>{ renderer?.dispose(); renderer=null; onComplete(); }, 420);
    } else {
      onComplete();
    }
  }
  listen(window,'wheel',e=>{
    if(locked()){e.preventDefault();return;}
    if(e.ctrlKey || Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    const now=performance.now(), gap=now-lastWheel;lastWheel=now;
    if(!bottom()){boundaryReady=false;return;}
    // Momentum from the gesture that reached the bottom must first go quiet.
    if(!boundaryReady){if(gap<180)return;boundaryReady=true;}
    if(e.deltaY<0 && state==='IDLE')return;
    e.preventDefault();
    const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
    pull(clamp(e.deltaY*unit,-90,90));
    clearTimeout(releaseTimer);releaseTimer=setTimeout(release,170);
  },{passive:false});
  listen(window,'touchstart',e=>{if(e.touches.length!==1)return;touchY=e.touches[0].clientY;touchBottom=bottom();},{passive:true});
  listen(window,'touchmove',e=>{
    if(locked()){e.preventDefault();return;}
    if(touchY===null||e.touches.length!==1)return;
    const y=e.touches[0].clientY, delta=touchY-y;touchY=y;
    if(!touchBottom||!bottom())return;
    if(delta>0||state==='PULLING'){e.preventDefault();pull(clamp(delta*1.65,-90,90));}
  },{passive:false});
  listen(window,'touchend',()=>{touchY=null;release();});
  listen(window,'touchcancel',()=>{touchY=null;release();});
  listen(window,'keydown',e=>{
    if(locked()){if([' ','ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key))e.preventDefault();return;}
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
    if(bottom()&&['ArrowDown','PageDown',' '].includes(e.key)){
      e.preventDefault();pull(85);clearTimeout(releaseTimer);releaseTimer=setTimeout(release,500);
    }
  });
  listen(invitation,'click',e=>{e.stopPropagation();if(state==='IDLE')setState('PULLING');activate();});
  listen(window,'click',e=>{if(locked()){e.stopImmediatePropagation();e.preventDefault();}},{capture:true});
  listen(window,'resize',()=>{if(locked()&&state!=='COMPLETE'){renderer?.dispose();renderer=null;}});
  return {
    get state(){return state;}, get transitionComplete(){return state==='COMPLETE';},
    destroy(){destroyed=true;controller.abort();clearTimeout(releaseTimer);cancelAnimationFrame(raf);renderer?.dispose();invitation.remove();
      hero.style.transform=original.transform;hero.style.visibility=original.visibility;hero.style.opacity=original.opacity;hero.hidden=original.hidden;hero.inert=original.inert;document.body.style.overflow=original.overflow;
      animations.forEach(a=>{if(a.playState==='paused')a.play();});delete document.documentElement.dataset.journeyState;},
  };
}
