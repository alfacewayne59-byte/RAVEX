import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Gamepad2, Compass, Boxes, Store, Users, Trophy, Coins, Settings, Search, Bell, Play, Plus, Menu, X, Zap, Crown, Map, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import './style.css';

function World({ onCollect, buildMode, mobileMove }) {
  const host = useRef(null);
  const state = useRef({ keys:{}, yaw:0, pitch:0.2, move:{x:0,z:0}, jump:false, blocks:[], lastCollect:0 });
  useEffect(() => {
    const el = host.current; if (!el) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#9ac8e8'); scene.fog = new THREE.Fog('#9ac8e8', 32, 100);
    const camera = new THREE.PerspectiveCamera(62, el.clientWidth/el.clientHeight, .1, 180);
    const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7)); renderer.setSize(el.clientWidth,el.clientHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xe5f5ff,0x426044,2));
    const sun = new THREE.DirectionalLight(0xfff1d5,2.4); sun.position.set(-15,28,12); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
    const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
    const grass=mat('#4d9368'), stone=mat('#738393'), white=mat('#e9f0f2'), dark=mat('#1a2737'), gold=mat('#ffcf59',.25,.65);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(130,130),grass); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
    const grid=new THREE.GridHelper(130,65,'#8fc69b','#659c79'); grid.position.y=-.1; scene.add(grid);
    const island=new THREE.Mesh(new THREE.CylinderGeometry(36,39,5,48),mat('#425b65')); island.position.y=-2.7; island.receiveShadow=true; scene.add(island);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(9,68),mat('#b8a78b')); path.rotation.x=-Math.PI/2; path.position.set(0,.01,-8); scene.add(path);
    function box(x,y,z,sx,sy,sz,m,shadow=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;scene.add(o);return o;}
    function tree(x,z){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,2,7),mat('#72513c'));trunk.position.set(x,1,z);trunk.castShadow=true;scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35,1),mat('#2c704d'));crown.position.set(x,2.55,z);crown.castShadow=true;scene.add(crown);}
    for(let i=0;i<42;i++){const a=i*2.399,r=16+(i%7)*2.6;tree(Math.cos(a)*r,Math.sin(a)*r);}
    // RAVEX spawn plaza
    box(0,.25,-13,17,.5,12,stone); box(0,.56,-13,14,.12,9,white);
    box(-5,2,-18,3,3,2,dark); box(-5,3.7,-18,3.2,.45,2.2,gold);
    box(5,2,-18,3,3,2,dark); box(5,3.7,-18,3.2,.45,2.2,mat('#67c9d7'));
    // portal arches
    for(let x of [-5,5]){box(x-1.2,2,-18,.35,4,.45,white);box(x+1.2,2,-18,.35,4,.45,white);box(x,4,-18,2.7,.35,.45,white);}
    // distant hills
    for(let i=0;i<14;i++){const a=i*Math.PI*2/14;const h=5+(i%4)*2;const hill=new THREE.Mesh(new THREE.ConeGeometry(7,h,7),mat(i%2?'#658d82':'#779c8d'));hill.position.set(Math.cos(a)*43,h/2-1,Math.sin(a)*43);scene.add(hill);}
    // Avatar
    const player=new THREE.Group(); scene.add(player);
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.9,5,10),mat('#273c55'));body.position.y=1.25;body.castShadow=true;player.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.43,18,14),mat('#c58c68'));head.position.y=2.15;head.castShadow=true;player.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.45,16,10,0,Math.PI*2,0,Math.PI*.55),mat('#1d2530'));hair.position.y=2.34;player.add(hair);
    const eyeMat=mat('#17202b');for(const x of [-.16,.16]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),eyeMat);eye.position.set(x,2.17,.37);player.add(eye);}
    const limbMat=mat('#c58c68');const legs=[];for(const x of [-.23,.23]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.55,4,8),dark);leg.position.set(x,.42,0);player.add(leg);legs.push(leg);}
    const arms=[];for(const x of [-.63,.63]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.55,4,8),limbMat);arm.position.set(x,1.35,0);arm.rotation.z=x<0?-.15:.15;player.add(arm);arms.push(arm);}
    player.position.set(0,0,1);
    // Floating crystal collectibles
    const crystals=[];for(let i=0;i<12;i++){const a=i*2.4,r=7+(i%3)*3;const c=new THREE.Mesh(new THREE.OctahedronGeometry(.48),gold);c.position.set(Math.cos(a)*r,.9,Math.sin(a)*r-4);c.castShadow=true;scene.add(c);crystals.push(c);}
    const blockMat=mat('#51b7c5',.35,.25);
    const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    const click=(e)=>{if(!buildMode)return;const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObject(ground);if(hits.length){const p=hits[0].point;const b=new THREE.Mesh(new THREE.BoxGeometry(2,1.4,2),blockMat);b.position.set(Math.round(p.x/2)*2,.7,Math.round(p.z/2)*2);b.castShadow=true;b.receiveShadow=true;scene.add(b);state.current.blocks.push(b);}};renderer.domElement.addEventListener('pointerdown',click);
    const down=e=>{state.current.keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();};
    const up=e=>{state.current.keys[e.code]=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    let last=0, frame=0, running=true;const clock=new THREE.Clock();
    function animate(){if(!running)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),s=state.current;
      const forward=(s.keys.KeyW||s.keys.ArrowUp?1:0)-(s.keys.KeyS||s.keys.ArrowDown?1:0)-s.move.z;
      const side=(s.keys.KeyD||s.keys.ArrowRight?1:0)-(s.keys.KeyA||s.keys.ArrowLeft?1:0)+s.move.x;
      const moving=Math.abs(forward)+Math.abs(side)>.05;const dir=new THREE.Vector3(side,0,-forward);if(dir.length()>1)dir.normalize();
      player.position.x+=dir.x*dt*7;player.position.z+=dir.z*dt*7;player.position.x=THREE.MathUtils.clamp(player.position.x,-30,30);player.position.z=THREE.MathUtils.clamp(player.position.z,-30,30);
      if(moving)player.rotation.y=Math.atan2(dir.x,dir.z);
      const t=clock.elapsedTime;legs[0].rotation.x=moving?Math.sin(t*10)*.65:0;legs[1].rotation.x=moving?-Math.sin(t*10)*.65:0;arms[0].rotation.x=moving?-Math.sin(t*10)*.45:0;arms[1].rotation.x=moving?Math.sin(t*10)*.45:0;
      player.position.y=s.keys.Space?Math.max(0,Math.sin(t*5)*.35):0;
      const desired=new THREE.Vector3(player.position.x+Math.sin(player.rotation.y)*8,5.4,player.position.z+Math.cos(player.rotation.y)*8);camera.position.lerp(desired,.09);camera.lookAt(player.position.x,1.3,player.position.z);
      crystals.forEach((c)=>{c.rotation.y+=dt*1.8;c.rotation.x+=dt*.5;c.position.y=.9+Math.sin(t*2+c.position.x)*.18;if(c.visible&&c.position.distanceTo(player.position)<1.45){c.visible=false;onCollect();}});
      renderer.render(scene,camera);
    }animate();
    const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};window.addEventListener('resize',resize);
    return()=>{running=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',click);renderer.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement);};
  },[onCollect,buildMode]);
  useEffect(()=>{state.current.move=mobileMove;},[mobileMove]);
  return <div className="world" ref={host}><div className="world-hint"><span className="live-dot"/> LIVE WORLD <span className="hint-sep"/> WASD / ARROWS TO MOVE · SPACE TO JUMP</div></div>;
}

function App(){
 const [tab,setTab]=useState('Play');const [coins,setCoins]=useState(()=>Number(localStorage.getItem('rvx')||1250));const [gems,setGems]=useState(0);const [build,setBuild]=useState(false);const [mobileMove,setMobileMove]=useState({x:0,z:0});const [notice,setNotice]=useState('Welcome to the RAVEX frontier');const [showMenu,setShowMenu]=useState(false);
 const collect=React.useCallback(()=>{setGems(g=>g+1);setCoins(c=>{const n=c+25;localStorage.setItem('rvx',String(n));return n;});setNotice('+25 RVX · Crystal collected');},[]);
 const nav=[['Play',Gamepad2],['Discover',Compass],['Build',Boxes],['Marketplace',Store],['Community',Users],['Achievements',Trophy]];
 return <div className="app-shell">
  <aside className={showMenu?'sidebar open':'sidebar'}><div className="brand"><div className="brand-mark">R</div><div><b>RAVEX</b><small>PLAY BEYOND LIMITS</small></div><button className="close-menu" onClick={()=>setShowMenu(false)}><X size={18}/></button></div>
   <div className="side-label">YOUR SPACE</div>{nav.map(([name,Icon])=><button key={name} onClick={()=>{setTab(name);setShowMenu(false);if(name==='Build')setBuild(true);else setBuild(false);}} className={'nav-item '+(tab===name?'active':'')}><Icon size={18}/><span>{name}</span>{name==='Play'&&<i/>}</button>)}
   <div className="side-bottom"><div className="creator-card"><div className="creator-icon"><Sparkles size={17}/></div><b>Have an idea?</b><p>Create a world others can explore.</p><button onClick={()=>{setTab('Build');setBuild(true);}}>OPEN BUILDER <ChevronRight size={14}/></button></div><div className="profile"><div className="avatar">W</div><div><b>Wayfarer</b><small>Rookie Explorer</small></div><Settings size={17}/></div></div>
  </aside>
  <main className="main"><header className="topbar"><button className="mobile-menu" onClick={()=>setShowMenu(true)}><Menu/></button><div className="crumb">RAVEX <span>/</span> <b>{tab.toUpperCase()}</b></div><div className="top-actions"><div className="wallet"><Coins size={17}/><b>{coins.toLocaleString()}</b><small>RVX</small></div><button className="icon-btn" onClick={()=>setNotice('You are all caught up!')}><Bell size={18}/></button><div className="avatar small">W</div></div></header>
   <section className="content"><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> SEASON 01 · THE FRONTIER</div><h1>{tab==='Play'?'Your next world awaits.':tab==='Build'?'Build something legendary.':tab==='Discover'?'Find your next adventure.':tab==='Marketplace'?'The RAVEX marketplace.':tab==='Community'?'Find your people.':'Your journey so far.'}</h1><p>Explore new places, meet creators, and make your mark.</p></div><button className="season-pill"><Crown size={15}/> FRONTIER PASS <ChevronRight size={14}/></button></div>
   {tab==='Play'||tab==='Build'?<><div className="game-stage"><div className="stage-top"><div><span className="stage-tag">FEATURED WORLD</span><h2>THE FRONTIER</h2><p>A new beginning. An open world to make your own.</p></div><div className="stage-actions"><span className="player-count"><i/> 1,284 EXPLORERS</span><button className={build?'build-btn selected':'build-btn'} onClick={()=>{setBuild(!build);setTab('Build');}}><Boxes size={16}/>{build?'BUILD MODE ON':'BUILD WORLD'}</button></div></div><World onCollect={collect} buildMode={build} mobileMove={mobileMove}/><div className="stage-bottom"><div className="world-stats"><span><Map size={15}/> OPEN WORLD</span><span><Users size={15}/> SOCIAL HUB</span><span><Zap size={15}/> EXPLORATION</span></div><div className="controls"><button onClick={()=>setNotice('Tip: collect glowing crystals to earn 25 RVX each.')}>HOW TO PLAY</button><button className="reset-btn" onClick={()=>{setNotice('Your explorer is ready. Keep exploring!');}}><RotateCcw size={14}/></button></div></div></div>
   <div className="below-grid"><div className="section-card"><div className="card-heading"><div><span className="eyebrow">KEEP EXPLORING</span><h3>World objectives</h3></div><span className="progress-label">{gems}/12</span></div><div className="objective"><div className="objective-icon gold"><Sparkles size={18}/></div><div className="objective-copy"><b>Crystal collector</b><small>Find glowing crystals across the island</small><div className="progress"><i style={{width:(gems/12*100)+'%'}}/></div></div><b className="reward">+300 RVX</b></div><div className="objective"><div className="objective-icon blue"><Compass size={18}/></div><div className="objective-copy"><b>Explore the frontier</b><small>Discover the spawn plaza and hidden paths</small><div className="progress"><i style={{width:'25%'}}/></div></div><b className="reward">+150 RVX</b></div></div><div className="section-card quick-card"><span className="eyebrow">YOUR INVENTORY</span><h3>Explorer essentials</h3><div className="inventory-row"><div className="inventory-item"><span className="item-art crystal">◆</span><b>{gems}</b><small>Crystals</small></div><div className="inventory-item"><span className="item-art cube">▧</span><b>{stateCount(build)}</b><small>Build mode</small></div><div className="inventory-item"><span className="item-art coin">◉</span><b>{coins.toLocaleString()}</b><small>RVX balance</small></div></div></div></div></>:<div className="empty-panel"><div className="empty-icon">{tab==='Discover'?<Compass/>:tab==='Marketplace'?<Store/>:tab==='Community'?<Users/>:<Trophy/>}</div><span className="eyebrow">COMING ONLINE</span><h2>{tab} is being prepared</h2><p>This area will connect to real RAVEX services as the platform grows. The playable Frontier world is ready to explore.</p><button className="primary-btn" onClick={()=>setTab('Play')}><Play size={16}/> RETURN TO THE FRONTIER</button></div>}
   </section><div className="toast" key={notice}>{notice}</div><footer>RAVEX © 2026 <span>AN ORIGINAL WORLD-BUILDING PLATFORM</span><span>RVX IS A DEMO GAME CURRENCY · NO CASH VALUE</span></footer>
  </main>
 </div>;
}
function stateCount(build){return build?'ON':'OFF';}
createRoot(document.getElementById('root')).render(<App/>);
