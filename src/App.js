import { useState, useEffect, useRef } from "react";

const SEED_REPORTS = [
  { id:"r1",authorId:"u2",officerName:"J. Martinez",badgeNumber:"4821",county:"Los Angeles County",date:"2024-11-15",title:"Unlawful traffic stop and vehicle search",description:"Was pulled over on the 405 with no stated reason. Officer Martinez demanded to search my vehicle without consent or probable cause. When I refused, I was held roadside for 45 minutes while they ran my plates repeatedly. No citation was issued.",similarCount:14,similarUsers:[],status:"approved",comments:[{id:"c1",authorId:"u2",author:"watchdog88",text:"Same officer stopped me on the 101 in October. No reason given, searched my car anyway.",date:"2024-11-18",status:"approved"},{id:"c2",authorId:"u2",author:"watchdog88",text:"Badge 4821 stopped my brother twice in the same week.",date:"2024-11-20",status:"approved"}]},
  { id:"r2",authorId:"u2",officerName:"T. Brennan",badgeNumber:"2209",county:"San Diego County",date:"2024-10-03",title:"Excessive force during noise complaint",description:"Police were called for a noise complaint at my neighbor's. Officer Brennan arrived and when I stepped outside he shoved me against my fence and zip-tied my wrists. Released without charges after 2 hours.",similarCount:6,similarUsers:[],status:"approved",comments:[{id:"c3",authorId:"u2",author:"watchdog88",text:"This officer has a reputation in my neighborhood. Very aggressive for minor calls.",date:"2024-10-10",status:"approved"}]},
  { id:"r3",authorId:"u2",officerName:"R. Okafor",badgeNumber:"7743",county:"Orange County",date:"2024-12-01",title:"Refused to take domestic violence report",description:"Arrived at my home after a call. Officer Okafor repeatedly questioned whether I was sure I wanted to file a report, suggested I was exaggerating, and after 10 minutes left without filing any documentation. I had visible injuries.",similarCount:3,similarUsers:[],status:"pending",comments:[]}
];

const SEED_USERS = [
  { id:"u1",username:"admin",email:"admin@badged.com",password:"Admin1234!",role:"admin",joined:"2024-01-01" },
  { id:"u2",username:"watchdog88",email:"watch@example.com",password:"Watch1234!",role:"user",joined:"2024-03-15" }
];

const SEED_ADS = [
  { id:"a1",firmName:"Rodriguez Civil Rights Law",contact:"info@rcrl.com",phone:"(213) 555-0182",website:"https://example.com",tagline:"Fighting for your rights since 1998",specialties:"Police misconduct · Excessive force · Civil rights",county:"Los Angeles County",status:"approved",plan:"featured",submitted:"2024-11-01" },
  { id:"a2",firmName:"Brennan & Associates",contact:"hello@brennanlaw.com",phone:"(619) 555-0247",website:"https://example.com",tagline:"Experienced in law enforcement accountability cases",specialties:"Wrongful arrest · False imprisonment",county:"San Diego County",status:"approved",plan:"standard",submitted:"2024-10-15" }
];

const COUNTIES = ["All Counties","Alameda County","Contra Costa County","Fresno County","Kern County","Los Angeles County","Marin County","Monterey County","Orange County","Riverside County","Sacramento County","San Bernardino County","San Diego County","San Francisco County","San Mateo County","Santa Barbara County","Santa Clara County","Shasta County","Solano County","Sonoma County","Stanislaus County","Ventura County"];

const PLANS = [
  { id:"standard", name:"Standard Listing", price:"$49/mo", features:["Your firm name & contact info","Listed in county directory","Basic profile page","Appear in relevant reports sidebar"] },
  { id:"featured", name:"Featured Listing", price:"$149/mo", features:["Everything in Standard","Featured badge & priority placement","Highlighted card design","Listed at top of county results","Logo & tagline display"] },
  { id:"premium", name:"Premium Sponsor", price:"$399/mo", features:["Everything in Featured","Sitewide sidebar placement","Banner on matching incident reports","Monthly performance report","Dedicated account contact"] }
];

function loadLS(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } }
function saveLS(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }
function initStorage(){
  if(!localStorage.getItem("cw_users")) saveLS("cw_users",SEED_USERS);
  if(!localStorage.getItem("cw_reports")) saveLS("cw_reports",SEED_REPORTS);
  if(!localStorage.getItem("cw_ads")) saveLS("cw_ads",SEED_ADS);
}
function timeAgo(d){ const diff=Math.floor((new Date()-new Date(d))/86400000); if(diff===0)return"today"; if(diff===1)return"yesterday"; if(diff<30)return`${diff}d ago`; if(diff<365)return`${Math.floor(diff/30)}mo ago`; return`${Math.floor(diff/365)}y ago`; }
function uid(){ return`${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }

function Avatar({name="?",size=36}){
  const i=name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const c=["#1a3a5c","#1a4a3a","#3a1a1a","#2a1a4a","#4a3a1a"];
  return <div style={{width:size,height:size,borderRadius:"50%",background:c[name.charCodeAt(0)%c.length],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{i}</div>;
}
function Pill({label,variant="default"}){
  const m={default:{bg:"#f0ede8",c:"#4a4540"},county:{bg:"#e8edf5",c:"#2a3d5c"},badge:{bg:"#1a1a1a",c:"#e8e4dc"},pending:{bg:"#fef3cd",c:"#7a5a00"},approved:{bg:"#e8f5e8",c:"#1a5a1a"},removed:{bg:"#fde8e8",c:"#7a1a1a"},admin:{bg:"#c8392b",c:"#fff"},featured:{bg:"#f5d76e",c:"#5a4500"}};
  const s=m[variant]||m.default;
  return <span style={{background:s.bg,color:s.c,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:3,letterSpacing:"0.07em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{label}</span>;
}
function Modal({children,onClose,maxWidth=660}){
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(10,8,6,0.65)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}}><div style={{background:"#fff",borderRadius:10,width:"100%",maxWidth,boxShadow:"0 20px 60px rgba(0,0,0,0.35)",position:"relative"}}><button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9a8e82",lineHeight:1,padding:4}}>✕</button>{children}</div></div>;
}
function Btn({children,variant="primary",size="md",style:ext={}, ...props}){
  const b={border:"none",borderRadius:6,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",transition:"opacity 0.15s"};
  const v={primary:{background:"#c8392b",color:"#fff"},dark:{background:"#1a1410",color:"#fff"},ghost:{background:"none",border:"1px solid #d8d0c8",color:"#4a3e32"},green:{background:"#1a5a1a",color:"#fff"},red:{background:"#c8392b",color:"#fff"},yellow:{background:"#b8860b",color:"#fff"},gold:{background:"#b8860b",color:"#fff"}};
  const s={sm:{padding:"5px 12px",fontSize:11},md:{padding:"9px 18px",fontSize:12},lg:{padding:"11px 22px",fontSize:13}};
  return <button {...props} style={{...b,...(v[variant]||v.primary),...(s[size]||s.md),...ext}} onMouseEnter={e=>e.currentTarget.style.opacity="0.82"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({username:"",email:"",password:"",confirm:""});
  const [err,setErr]=useState({});
  const [msg,setMsg]=useState("");
  const [resetEmail,setResetEmail]=useState("");
  const [resetStep,setResetStep]=useState(0); // 0=hidden,1=email,2=newpw
  const [resetUser,setResetUser]=useState(null);
  const [newPw,setNewPw]=useState({pw:"",confirm:""});
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const iSt=e=>({width:"100%",padding:"9px 12px",border:`1px solid ${e?"#c8392b":"#d8d0c8"}`,borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",color:"#1a1410"});
  const lSt={display:"block",fontSize:11,fontWeight:700,color:"#4a3e32",marginBottom:4,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"};

  function doLogin(){
    const users=loadLS("cw_users",[]);
    const user=users.find(u=>(u.username===form.username||u.email===form.username)&&u.password===form.password);
    if(!user){setErr({global:"Invalid username or password."});return;}
    if(user.banned){setErr({global:"Your account has been suspended."});return;}
    onLogin(user);
  }
  function doRegister(){
    const e={};
    if(!form.username.trim()||form.username.length<3) e.username="Min 3 characters";
    if(!/\S+@\S+\.\S+/.test(form.email)) e.email="Valid email required";
    if(form.password.length<8) e.password="Min 8 characters";
    if(form.password!==form.confirm) e.confirm="Passwords don't match";
    if(Object.keys(e).length){setErr(e);return;}
    const users=loadLS("cw_users",[]);
    if(users.find(u=>u.username===form.username)){setErr({username:"Username taken"});return;}
    if(users.find(u=>u.email===form.email)){setErr({email:"Email already registered"});return;}
    const nu={id:`u${uid()}`,username:form.username.trim(),email:form.email.trim(),password:form.password,role:"user",joined:new Date().toISOString().split("T")[0]};
    saveLS("cw_users",[...users,nu]);
    setMsg("Account created! You can now sign in.");
    setTab("login");
    setForm(p=>({...p,username:nu.username,password:"",confirm:"",email:""}));
    setErr({});
  }
  function doResetLookup(){
    const users=loadLS("cw_users",[]);
    const u=users.find(x=>x.email===resetEmail.trim());
    if(!u){setErr({resetEmail:"No account found with that email."});return;}
    setResetUser(u);
    setResetStep(2);
    setErr({});
  }
  function doResetPassword(){
    const e={};
    if(newPw.pw.length<8) e.pw="Min 8 characters";
    if(newPw.pw!==newPw.confirm) e.confirm="Passwords don't match";
    if(Object.keys(e).length){setErr(e);return;}
    const users=loadLS("cw_users",[]);
    saveLS("cw_users",users.map(u=>u.id===resetUser.id?{...u,password:newPw.pw}:u));
    setMsg("Password updated! You can now sign in.");
    setResetStep(0); setResetEmail(""); setNewPw({pw:"",confirm:""}); setResetUser(null);
    setTab("login"); setErr({});
  }

  return (
    <div style={{minHeight:"100vh",background:"#f5f0ea",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"Georgia,serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:40,marginBottom:8}}>⚖</div>
        <h1 style={{margin:"0 0 4px",fontFamily:"'Playfair Display',serif",fontSize:30,color:"#1a1410"}}>Badged</h1>
        <p style={{margin:0,fontSize:11,color:"#9a8e82",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.1em"}}>Officer Accountability Forum</p>
      </div>
      <div style={{background:"#fff",borderRadius:10,width:"100%",maxWidth:420,boxShadow:"0 4px 24px rgba(0,0,0,0.1)",overflow:"hidden"}}>
        {resetStep===0&&<>
          <div style={{display:"flex",borderBottom:"1px solid #e8e0d4"}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setErr({});setMsg("");}} style={{flex:1,padding:"14px",background:tab===t?"#fff":"#faf7f4",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:tab===t?"#c8392b":"#8a7e72",borderBottom:tab===t?"2px solid #c8392b":"2px solid transparent"}}>
                {t==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          <div style={{padding:"24px 28px 28px"}}>
            {msg&&<div style={{background:"#e8f5e8",border:"1px solid #c8e8c8",borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#1a5a1a"}}>{msg}</div>}
            {err.global&&<div style={{background:"#fde8e8",border:"1px solid #f0c8c8",borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#7a1a1a"}}>{err.global}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <label style={lSt}>{tab==="login"?"Username or Email":"Username"}</label>
                <input placeholder={tab==="login"?"Enter username or email":"Choose a username"} value={form.username} onChange={f("username")} style={iSt(err.username)}/>
                {err.username&&<span style={{fontSize:11,color:"#c8392b"}}>{err.username}</span>}
              </div>
              {tab==="register"&&<div>
                <label style={lSt}>Email</label>
                <input type="email" placeholder="your@email.com" value={form.email} onChange={f("email")} style={iSt(err.email)}/>
                {err.email&&<span style={{fontSize:11,color:"#c8392b"}}>{err.email}</span>}
              </div>}
              <div>
                <label style={lSt}>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={f("password")} style={iSt(err.password)}/>
                {err.password&&<span style={{fontSize:11,color:"#c8392b"}}>{err.password}</span>}
              </div>
              {tab==="register"&&<div>
                <label style={lSt}>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={form.confirm} onChange={f("confirm")} style={iSt(err.confirm)}/>
                {err.confirm&&<span style={{fontSize:11,color:"#c8392b"}}>{err.confirm}</span>}
              </div>}
              <Btn variant="primary" size="lg" onClick={tab==="login"?doLogin:doRegister} style={{width:"100%",marginTop:4}}>
                {tab==="login"?"Sign In →":"Create Account →"}
              </Btn>
            </div>
            {tab==="login"&&<div style={{marginTop:14,textAlign:"center"}}>
              <button onClick={()=>{setResetStep(1);setErr({});}} style={{background:"none",border:"none",color:"#c8392b",fontSize:12,cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Mono',monospace"}}>Forgot password?</button>
            </div>}
          </div>
        </>}

        {/* Reset step 1: enter email */}
        {resetStep===1&&<div style={{padding:"28px"}}>
          <h3 style={{margin:"0 0 8px",fontFamily:"'Playfair Display',serif",fontSize:18}}>Reset Password</h3>
          <p style={{margin:"0 0 16px",fontSize:13,color:"#6a5e52"}}>Enter the email address on your account.</p>
          <label style={lSt}>Email Address</label>
          <input type="email" placeholder="your@email.com" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} style={iSt(err.resetEmail)}/>
          {err.resetEmail&&<span style={{fontSize:11,color:"#c8392b",display:"block",marginTop:3}}>{err.resetEmail}</span>}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn variant="ghost" size="md" onClick={()=>{setResetStep(0);setErr({});}}>← Back</Btn>
            <Btn variant="primary" size="md" onClick={doResetLookup} style={{flex:1}}>Continue →</Btn>
          </div>
        </div>}

        {/* Reset step 2: new password */}
        {resetStep===2&&<div style={{padding:"28px"}}>
          <h3 style={{margin:"0 0 8px",fontFamily:"'Playfair Display',serif",fontSize:18}}>New Password</h3>
          <p style={{margin:"0 0 16px",fontSize:13,color:"#6a5e52"}}>Choose a new password for <strong>{resetUser?.username}</strong>.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={lSt}>New Password</label>
              <input type="password" placeholder="Min 8 characters" value={newPw.pw} onChange={e=>setNewPw(p=>({...p,pw:e.target.value}))} style={iSt(err.pw)}/>
              {err.pw&&<span style={{fontSize:11,color:"#c8392b"}}>{err.pw}</span>}
            </div>
            <div>
              <label style={lSt}>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={newPw.confirm} onChange={e=>setNewPw(p=>({...p,confirm:e.target.value}))} style={iSt(err.confirm)}/>
              {err.confirm&&<span style={{fontSize:11,color:"#c8392b"}}>{err.confirm}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn variant="ghost" size="md" onClick={()=>{setResetStep(1);setErr({});}}>← Back</Btn>
            <Btn variant="primary" size="md" onClick={doResetPassword} style={{flex:1}}>Update Password</Btn>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── Advertise Page ────────────────────────────────────────────────────────────
function AdvertisePage({onBack,currentUser}){
  const [ads]=useState(()=>loadLS("cw_ads",[]).filter(a=>a.status==="approved"));
  const [showForm,setShowForm]=useState(false);
  const [selectedPlan,setSelectedPlan]=useState(null);
  const [form,setForm]=useState({firmName:"",contact:"",phone:"",website:"",tagline:"",specialties:"",county:""});
  const [submitted,setSubmitted]=useState(false);
  const [err,setErr]=useState({});
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const iSt=e=>({width:"100%",padding:"9px 12px",border:`1px solid ${e?"#c8392b":"#d8d0c8"}`,borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",color:"#1a1410",background:"#fff"});
  const lSt={display:"block",fontSize:11,fontWeight:700,color:"#4a3e32",marginBottom:4,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"};

  function doSubmit(){
    const e={};
    if(!form.firmName.trim()) e.firmName="Required";
    if(!form.contact.trim()||!/\S+@\S+\.\S+/.test(form.contact)) e.contact="Valid email required";
    if(!form.county) e.county="Required";
    if(!selectedPlan) e.plan="Please select a plan";
    if(Object.keys(e).length){setErr(e);return;}
    const existing=loadLS("cw_ads",[]);
    const na={id:`a${uid()}`,firmName:form.firmName.trim(),contact:form.contact.trim(),phone:form.phone.trim(),website:form.website.trim(),tagline:form.tagline.trim(),specialties:form.specialties.trim(),county:form.county,status:"pending",plan:selectedPlan,submitted:new Date().toISOString().split("T")[0]};
    saveLS("cw_ads",[...existing,na]);
    setSubmitted(true);
  }

  return (
    <div style={{minHeight:"100vh",background:"#f5f0ea",fontFamily:"Georgia,serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      {/* Header */}
      <div style={{background:"#1a1410",borderBottom:"2px solid #c8392b",padding:"0 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20,color:"#c8392b"}}>⚖</span>
            <span style={{color:"#e8e0d4",fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Badged</span>
          </div>
          <Btn variant="ghost" size="sm" onClick={onBack} style={{color:"#c8b890",borderColor:"#3a2a1a"}}>← Back to Forum</Btn>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px 60px"}}>
        {/* Hero */}
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{display:"inline-block",background:"#c8392b",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:3,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>For Attorneys & Law Firms</div>
          <h1 style={{margin:"0 0 14px",fontFamily:"'Playfair Display',serif",fontSize:36,color:"#1a1410",lineHeight:1.2}}>Reach People Who Need<br/>a Civil Rights Attorney</h1>
          <p style={{margin:"0 auto",fontSize:15,color:"#6a5e52",lineHeight:1.7,maxWidth:560}}>Badged connects you directly with individuals who have experienced police misconduct and are actively seeking legal representation. Our audience is pre-qualified — they are on this platform because something happened to them.</p>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:48}}>
          {[["Active Users","2,400+","Growing monthly"],["Reports Filed","800+","Verified incidents"],["Avg. Time on Site","6 min","High-intent visitors"]].map(([l,v,s])=>(
            <div key={l} style={{background:"#fff",border:"1px solid #e8e4dc",borderRadius:8,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:800,color:"#c8392b",fontFamily:"'DM Mono',monospace"}}>{v}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1410",marginTop:4}}>{l}</div>
              <div style={{fontSize:11,color:"#9a8e82",marginTop:2}}>{s}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#1a1410",marginBottom:6,textAlign:"center"}}>Advertising Plans</h2>
        <p style={{textAlign:"center",color:"#8a7e72",fontSize:13,marginBottom:28,fontFamily:"'DM Mono',monospace"}}>All plans include admin review and approval before going live.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:48}}>
          {PLANS.map(p=>(
            <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{background:"#fff",border:`2px solid ${selectedPlan===p.id?"#c8392b":p.id==="featured"?"#b8860b":"#e8e4dc"}`,borderRadius:10,padding:"24px 20px",cursor:"pointer",position:"relative",transition:"border-color 0.15s",boxShadow:p.id==="featured"?"0 4px 20px rgba(184,134,11,0.15)":"none"}}>
              {p.id==="featured"&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#b8860b",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Most Popular</div>}
              {selectedPlan===p.id&&<div style={{position:"absolute",top:12,right:12,background:"#c8392b",color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✓</div>}
              <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",color:"#8a7e72",marginBottom:4}}>{p.name}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:"#1a1410",marginBottom:14}}>{p.price}</div>
              <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:7}}>
                {p.features.map((feat,i)=>(
                  <li key={i} style={{fontSize:12,color:"#4a3e32",display:"flex",gap:7,alignItems:"flex-start"}}>
                    <span style={{color:"#1a5a1a",fontWeight:700,flexShrink:0}}>✓</span>{feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {err.plan&&<p style={{color:"#c8392b",fontSize:12,textAlign:"center",marginTop:-36,marginBottom:24,fontFamily:"'DM Mono',monospace"}}>{err.plan}</p>}

        {/* Current advertisers */}
        {ads.length>0&&<>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1a1410",marginBottom:16}}>Current Advertisers</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:48}}>
            {ads.map(a=>(
              <div key={a.id} style={{background:"#fff",border:`1px solid ${a.plan==="featured"?"#b8860b":"#e8e4dc"}`,borderRadius:8,padding:"16px 20px",borderLeft:`3px solid ${a.plan==="featured"?"#b8860b":a.plan==="premium"?"#c8392b":"#3a5a3a"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#1a1410",fontFamily:"'Playfair Display',serif"}}>{a.firmName}</span>
                      {a.plan==="featured"&&<Pill label="Featured" variant="featured"/>}
                      {a.plan==="premium"&&<Pill label="Premium" variant="admin"/>}
                      <Pill label={a.county} variant="county"/>
                    </div>
                    {a.tagline&&<p style={{margin:"0 0 4px",fontSize:13,color:"#4a4038",fontStyle:"italic"}}>"{a.tagline}"</p>}
                    {a.specialties&&<p style={{margin:0,fontSize:12,color:"#6a5e52"}}>{a.specialties}</p>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
                    {a.phone&&<span style={{fontSize:12,color:"#2a3d5c",fontFamily:"'DM Mono',monospace"}}>{a.phone}</span>}
                    {a.website&&<a href={a.website} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#c8392b",textDecoration:"none",fontFamily:"'DM Mono',monospace"}} onClick={e=>e.stopPropagation()}>Visit Website →</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* Application form */}
        <div style={{background:"#fff",border:"1px solid #e8e4dc",borderRadius:10,padding:"32px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          {submitted?<div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1a5a1a",margin:"0 0 10px"}}>Application Received!</h3>
            <p style={{fontSize:14,color:"#4a3e32",margin:"0 0 20px",lineHeight:1.6}}>We'll review your listing and be in touch at <strong>{form.contact}</strong> within 1–2 business days. Once approved, your listing goes live immediately.</p>
            <Btn variant="ghost" size="md" onClick={()=>setSubmitted(false)}>Submit Another</Btn>
          </div>:<>
            <h3 style={{margin:"0 0 4px",fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1a1410"}}>Apply to Advertise</h3>
            <p style={{margin:"0 0 22px",fontSize:13,color:"#8a7e72"}}>Fill out the form below. All listings are reviewed by our team before going live. {!selectedPlan&&<span style={{color:"#b8860b"}}>Select a plan above first.</span>}</p>
            {selectedPlan&&<div style={{background:"#f5f0e8",border:"1px solid #e0d0b0",borderRadius:6,padding:"10px 14px",marginBottom:20,fontSize:12,color:"#5a4a1a",fontFamily:"'DM Mono',monospace"}}>Selected: <strong>{PLANS.find(p=>p.id===selectedPlan)?.name}</strong> — {PLANS.find(p=>p.id===selectedPlan)?.price}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"13px 16px"}}>
              {[{k:"firmName",l:"Firm / Attorney Name",p:"e.g. Rodriguez Civil Rights Law",full:true},{k:"contact",l:"Contact Email",p:"billing@yourfirm.com",full:false},{k:"phone",l:"Phone (optional)",p:"(213) 555-0100",full:false}].map(({k,l,p,full})=>(
                <div key={k} style={{gridColumn:full?"1 / -1":undefined}}>
                  <label style={lSt}>{l}</label>
                  <input value={form[k]} onChange={f(k)} placeholder={p} style={iSt(err[k])}/>
                  {err[k]&&<span style={{fontSize:11,color:"#c8392b"}}>{err[k]}</span>}
                </div>
              ))}
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>County You Serve</label>
                <select value={form.county} onChange={f("county")} style={iSt(err.county)}>
                  <option value="">Select county...</option>
                  {COUNTIES.filter(c=>c!=="All Counties").map(c=><option key={c}>{c}</option>)}
                  <option value="Statewide">Statewide — All Counties</option>
                </select>
                {err.county&&<span style={{fontSize:11,color:"#c8392b"}}>{err.county}</span>}
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Website URL (optional)</label>
                <input value={form.website} onChange={f("website")} placeholder="https://yourfirm.com" style={iSt()}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Tagline (optional)</label>
                <input value={form.tagline} onChange={f("tagline")} placeholder="e.g. Fighting for your rights since 1998" style={iSt()}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Practice Areas / Specialties (optional)</label>
                <input value={form.specialties} onChange={f("specialties")} placeholder="e.g. Police misconduct · Excessive force · Civil rights" style={iSt()}/>
              </div>
            </div>
            <div style={{background:"#f5f0e8",border:"1px solid #e0d8c8",borderRadius:5,padding:"9px 12px",marginTop:16,fontSize:11,color:"#7a6e5a"}}>
              By submitting, you agree that your listing will be reviewed. Badged reserves the right to decline any listing. Payment details will be confirmed via email after approval.
            </div>
            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
              <Btn variant="primary" size="lg" onClick={doSubmit}>Submit Application →</Btn>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({currentUser,onClose}){
  const [tab,setTab]=useState("reports");
  const [reports,setReports]=useState(loadLS("cw_reports",[]));
  const [users,setUsers]=useState(loadLS("cw_users",[]));
  const [ads,setAds]=useState(loadLS("cw_ads",[]));
  const [toast,setToast]=useState(null);
  const tRef=useRef();
  function showToast(m){setToast(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),2500);}
  function setReportStatus(id,s){const u=reports.map(r=>r.id===id?{...r,status:s}:r);setReports(u);saveLS("cw_reports",u);showToast(`Report ${s}.`);}
  function deleteReport(id){const u=reports.filter(r=>r.id!==id);setReports(u);saveLS("cw_reports",u);showToast("Deleted.");}
  function setCmtStatus(rId,cId,s){const u=reports.map(r=>r.id===rId?{...r,comments:r.comments.map(c=>c.id===cId?{...c,status:s}:c)}:r);setReports(u);saveLS("cw_reports",u);showToast(`Comment ${s}.`);}
  function toggleBan(u2){const u=users.map(u=>u.id===u2.id?{...u,banned:!u2.banned}:u);setUsers(u);saveLS("cw_users",u);showToast(u2.banned?"Unbanned.":"Banned.");}
  function setAdStatus(id,s){const u=ads.map(a=>a.id===id?{...a,status:s}:a);setAds(u);saveLS("cw_ads",u);showToast(`Ad ${s}.`);}
  function deleteAd(id){const u=ads.filter(a=>a.id!==id);setAds(u);saveLS("cw_ads",u);showToast("Ad deleted.");}
  const tSt=a=>({padding:"9px 16px",background:a?"#1a1410":"none",color:a?"#e8e0d4":"#7a6e62",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",borderRadius:5});
  const pending=reports.filter(r=>r.status==="pending");
  const pendingAds=ads.filter(a=>a.status==="pending");

  return (
    <div style={{minHeight:"100vh",background:"#1a1410",fontFamily:"Georgia,serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{background:"#0e0c08",borderBottom:"1px solid #3a2a1a",padding:"0 24px"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18,color:"#c8392b"}}>⚖</span>
            <span style={{color:"#e8e0d4",fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>Badged</span>
            <Pill label="Admin" variant="admin"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{color:"#7a6e62",fontSize:11,fontFamily:"'DM Mono',monospace"}}>Signed in as <strong style={{color:"#e8e0d4"}}>{currentUser.username}</strong></span>
            <Btn variant="ghost" size="sm" onClick={onClose} style={{color:"#c8b890",borderColor:"#3a2a1a"}}>← Forum</Btn>
          </div>
        </div>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:22}}>
          {[["Reports",reports.length,"#e8e0d4"],["Pending Reports",pending.length,"#f5d76e"],["Approved",reports.filter(r=>r.status==="approved").length,"#6ee88a"],["Users",users.length,"#6ea8e8"],["Ad Applications",pendingAds.length,"#f5a76e"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#2a2018",borderRadius:8,padding:"12px 14px",border:"1px solid #3a3028"}}>
              <div style={{fontSize:22,fontWeight:800,fontFamily:"'DM Mono',monospace",color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#7a6e62",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:4,marginBottom:18,background:"#2a2018",padding:5,borderRadius:8,width:"fit-content",flexWrap:"wrap"}}>
          <button style={tSt(tab==="reports")} onClick={()=>setTab("reports")}>Reports {pending.length>0&&`(${pending.length})`}</button>
          <button style={tSt(tab==="comments")} onClick={()=>setTab("comments")}>Comments</button>
          <button style={tSt(tab==="users")} onClick={()=>setTab("users")}>Users</button>
          <button style={tSt(tab==="ads")} onClick={()=>setTab("ads")}>Ads {pendingAds.length>0&&`(${pendingAds.length})`}</button>
        </div>

        {tab==="reports"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {reports.length===0&&<p style={{color:"#5a4e42",fontFamily:"'DM Mono',monospace",fontSize:13}}>No reports.</p>}
          {reports.map(r=>(
            <div key={r.id} style={{background:"#2a2018",borderRadius:8,padding:"14px 18px",border:`1px solid ${r.status==="pending"?"#7a5a00":r.status==="removed"?"#7a1a1a":"#3a3028"}`,borderLeft:`3px solid ${r.status==="pending"?"#f5d76e":r.status==="removed"?"#c8392b":"#1a8a1a"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                    <Pill label={r.status} variant={r.status==="pending"?"pending":r.status==="approved"?"approved":"removed"}/>
                    <span style={{color:"#e8d0b0",fontWeight:700,fontSize:12,fontFamily:"'DM Mono',monospace"}}>#{r.badgeNumber}</span>
                    <span style={{color:"#c8b890",fontSize:12}}>{r.officerName}</span>
                    <span style={{color:"#6a5e52",fontSize:11}}>{r.county}</span>
                  </div>
                  <p style={{margin:"0 0 3px",color:"#e8e0d4",fontSize:13,fontWeight:600}}>{r.title}</p>
                  <p style={{margin:"0 0 3px",color:"#7a6e62",fontSize:12,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.description}</p>
                  <span style={{color:"#4a4038",fontSize:11,fontFamily:"'DM Mono',monospace"}}>{timeAgo(r.date)} · {r.comments.length} comments</span>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
                  {r.status!=="approved"&&<Btn variant="green" size="sm" onClick={()=>setReportStatus(r.id,"approved")}>✓ Approve</Btn>}
                  {r.status!=="pending"&&<Btn variant="yellow" size="sm" onClick={()=>setReportStatus(r.id,"pending")}>⏸ Pending</Btn>}
                  {r.status!=="removed"&&<Btn variant="red" size="sm" onClick={()=>setReportStatus(r.id,"removed")}>✕ Remove</Btn>}
                  <Btn variant="ghost" size="sm" onClick={()=>deleteReport(r.id)} style={{color:"#c8392b",borderColor:"#5a2a2a"}}>🗑</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>}

        {tab==="comments"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {reports.flatMap(r=>r.comments.map(c=>({...c,reportTitle:r.title,reportId:r.id}))).length===0&&<p style={{color:"#5a4e42",fontFamily:"'DM Mono',monospace",fontSize:13}}>No comments.</p>}
          {reports.flatMap(r=>r.comments.map(c=>({...c,reportTitle:r.title,reportId:r.id}))).map(c=>(
            <div key={c.id} style={{background:"#2a2018",borderRadius:8,padding:"12px 16px",border:`1px solid ${c.status==="removed"?"#7a1a1a":"#3a3028"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 4px",color:"#7a6e62",fontSize:11,fontFamily:"'DM Mono',monospace"}}>On: <span style={{color:"#c8b890"}}>{c.reportTitle}</span></p>
                  <p style={{margin:"0 0 4px",color:"#e8e0d4",fontSize:13,lineHeight:1.5}}>{c.text}</p>
                  <span style={{color:"#4a4038",fontSize:11,fontFamily:"'DM Mono',monospace"}}>by {c.author} · {timeAgo(c.date)}</span>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {c.status!=="approved"&&<Btn variant="green" size="sm" onClick={()=>setCmtStatus(c.reportId,c.id,"approved")}>✓</Btn>}
                  {c.status!=="removed"&&<Btn variant="red" size="sm" onClick={()=>setCmtStatus(c.reportId,c.id,"removed")}>✕ Remove</Btn>}
                </div>
              </div>
            </div>
          ))}
        </div>}

        {tab==="users"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.filter(u=>u.id!==currentUser.id).map(u=>(
            <div key={u.id} style={{background:"#2a2018",borderRadius:8,padding:"12px 16px",border:`1px solid ${u.banned?"#7a1a1a":"#3a3028"}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar name={u.username} size={34}/>
                <div>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                    <span style={{color:"#e8e0d4",fontWeight:600,fontSize:13}}>{u.username}</span>
                    <Pill label={u.role} variant={u.role==="admin"?"admin":"default"}/>
                    {u.banned&&<Pill label="Banned" variant="removed"/>}
                  </div>
                  <span style={{color:"#4a4038",fontSize:11,fontFamily:"'DM Mono',monospace"}}>{u.email} · joined {u.joined}</span>
                </div>
              </div>
              {u.role!=="admin"&&<Btn variant={u.banned?"green":"red"} size="sm" onClick={()=>toggleBan(u)}>{u.banned?"Unban":"Ban"}</Btn>}
            </div>
          ))}
        </div>}

        {tab==="ads"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {ads.length===0&&<p style={{color:"#5a4e42",fontFamily:"'DM Mono',monospace",fontSize:13}}>No ad applications.</p>}
          {ads.map(a=>(
            <div key={a.id} style={{background:"#2a2018",borderRadius:8,padding:"14px 18px",border:`1px solid ${a.status==="pending"?"#7a5a00":a.status==="removed"?"#7a1a1a":"#3a3028"}`,borderLeft:`3px solid ${a.status==="pending"?"#f5d76e":a.status==="approved"?"#1a8a1a":"#c8392b"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                    <Pill label={a.status} variant={a.status==="pending"?"pending":a.status==="approved"?"approved":"removed"}/>
                    <span style={{color:"#f5d76e",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{PLANS.find(p=>p.id===a.plan)?.name}</span>
                    <span style={{color:"#f5d76e",fontSize:11,fontFamily:"'DM Mono',monospace"}}>{PLANS.find(p=>p.id===a.plan)?.price}</span>
                  </div>
                  <p style={{margin:"0 0 2px",color:"#e8e0d4",fontSize:14,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{a.firmName}</p>
                  <p style={{margin:"0 0 2px",color:"#c8b890",fontSize:12,fontFamily:"'DM Mono',monospace"}}>{a.contact} {a.phone&&`· ${a.phone}`}</p>
                  <p style={{margin:"0 0 2px",color:"#8a7e72",fontSize:12}}>{a.county} {a.specialties&&`· ${a.specialties}`}</p>
                  {a.tagline&&<p style={{margin:0,color:"#6a5e52",fontSize:12,fontStyle:"italic"}}>"{a.tagline}"</p>}
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
                  {a.status!=="approved"&&<Btn variant="green" size="sm" onClick={()=>setAdStatus(a.id,"approved")}>✓ Approve</Btn>}
                  {a.status!=="pending"&&<Btn variant="yellow" size="sm" onClick={()=>setAdStatus(a.id,"pending")}>⏸ Pending</Btn>}
                  {a.status!=="removed"&&<Btn variant="red" size="sm" onClick={()=>setAdStatus(a.id,"removed")}>✕ Remove</Btn>}
                  <Btn variant="ghost" size="sm" onClick={()=>deleteAd(a.id)} style={{color:"#c8392b",borderColor:"#5a2a2a"}}>🗑</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1a5a1a",color:"#e8f5e8",padding:"10px 20px",borderRadius:8,fontSize:13,fontFamily:"'DM Mono',monospace",zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>{toast}</div>}
    </div>
  );
}

// ── Main Forum ────────────────────────────────────────────────────────────────
export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [view,setView]=useState("forum"); // forum | admin | advertise
  const [reports,setReports]=useState([]);
  const [ads,setAds]=useState([]);
  const [search,setSearch]=useState("");
  const [countyFilter,setCountyFilter]=useState("All Counties");
  const [selectedReport,setSelectedReport]=useState(null);
  const [showSubmit,setShowSubmit]=useState(false);
  const [showComment,setShowComment]=useState(false);
  const [commentText,setCommentText]=useState("");
  const [toast,setToast]=useState(null);
  const [form,setForm]=useState({officerName:"",badgeNumber:"",county:"",title:"",description:"",date:""});
  const [formErrors,setFormErrors]=useState({});
  const tRef=useRef();

  useEffect(()=>{ initStorage(); },[]);
  useEffect(()=>{
    if(currentUser){
      setReports(loadLS("cw_reports",[]));
      setAds(loadLS("cw_ads",[]).filter(a=>a.status==="approved"));
    }
  },[currentUser,view]);

  function showToast(m){setToast(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),3000);}
  function saveReports(r){setReports(r);saveLS("cw_reports",r);}
  function handleLogin(user){setCurrentUser(user);setReports(loadLS("cw_reports",[]));setAds(loadLS("cw_ads",[]).filter(a=>a.status==="approved"));}
  function handleLogout(){setCurrentUser(null);setView("forum");}

  function handleSimilar(id){
    const r=reports.find(r=>r.id===id);
    if(r.similarUsers?.includes(currentUser.id)){showToast("You've already logged a similar encounter.");return;}
    const updated=reports.map(r=>r.id===id?{...r,similarCount:r.similarCount+1,similarUsers:[...(r.similarUsers||[]),currentUser.id]}:r);
    saveReports(updated);
    if(selectedReport?.id===id) setSelectedReport(updated.find(r=>r.id===id));
    showToast("Your similar encounter has been recorded.");
  }
  function handleAddComment(){
    if(!commentText.trim()) return;
    const nc={id:`c${uid()}`,authorId:currentUser.id,author:currentUser.username,text:commentText.trim(),date:new Date().toISOString().split("T")[0],status:"approved"};
    const updated=reports.map(r=>r.id===selectedReport.id?{...r,comments:[...r.comments,nc]}:r);
    saveReports(updated);
    setSelectedReport(updated.find(r=>r.id===selectedReport.id));
    setCommentText("");setShowComment(false);showToast("Comment posted.");
  }
  function handleSubmitReport(){
    const e={};
    if(!form.officerName.trim()) e.officerName="Required";
    if(!form.badgeNumber.trim()) e.badgeNumber="Required";
    if(!form.county) e.county="Required";
    if(!form.title.trim()) e.title="Required";
    if(form.description.trim().length<30) e.description="Min 30 characters";
    if(Object.keys(e).length){setFormErrors(e);return;}
    const nr={id:`r${uid()}`,authorId:currentUser.id,officerName:form.officerName.trim(),badgeNumber:form.badgeNumber.trim(),county:form.county,date:form.date||new Date().toISOString().split("T")[0],title:form.title.trim(),description:form.description.trim(),similarCount:0,similarUsers:[],status:"pending",comments:[]};
    saveReports([nr,...reports]);
    setForm({officerName:"",badgeNumber:"",county:"",title:"",description:"",date:""});
    setFormErrors({});setShowSubmit(false);
    showToast("Report submitted for admin review.");
  }

  const iSt=e=>({width:"100%",padding:"9px 12px",border:`1px solid ${e?"#c8392b":"#d8d0c8"}`,borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",color:"#1a1410",background:"#fff"});
  const lSt={display:"block",fontSize:11,fontWeight:700,color:"#4a3e32",marginBottom:4,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"};

  const visible=reports
    .filter(r=>r.status==="approved"||r.authorId===currentUser?.id)
    .filter(r=>{
      const q=search.toLowerCase();
      return (!q||(r.officerName.toLowerCase().includes(q)||r.badgeNumber.includes(q)||r.county.toLowerCase().includes(q)||r.title.toLowerCase().includes(q)))
        &&(countyFilter==="All Counties"||r.county===countyFilter);
    });

  // Sidebar ads: pick up to 2 relevant to current county filter or random
  const sidebarAds=ads.filter(a=>countyFilter==="All Counties"||a.county===countyFilter||a.county==="Statewide — All Counties").slice(0,3);

  if(!currentUser) return <AuthScreen onLogin={handleLogin}/>;
  if(view==="admin"&&currentUser.role==="admin") return <AdminPanel currentUser={currentUser} onClose={()=>{setView("forum");setReports(loadLS("cw_reports",[]));setAds(loadLS("cw_ads",[]).filter(a=>a.status==="approved"));}}/>;
  if(view==="advertise") return <AdvertisePage onBack={()=>setView("forum")} currentUser={currentUser}/>;

  return (
    <div style={{minHeight:"100vh",background:"#f5f0ea",fontFamily:"Georgia,serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"#1a1410",borderBottom:"2px solid #c8392b",padding:"0 24px"}}>
        <div style={{maxWidth:1020,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20,color:"#c8392b"}}>⚖</span>
              <span style={{color:"#e8e0d4",fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Badged</span>
            </div>
            <p style={{color:"#7a6e62",fontSize:10,margin:"2px 0 0",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Officer Accountability</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setView("advertise")} style={{background:"none",border:"none",color:"#f5d76e",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer",padding:"4px 8px",borderRadius:4,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(245,215,110,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>Advertise with Us</button>
            <Avatar name={currentUser.username} size={26}/>
            <span style={{color:"#c8b890",fontSize:11,fontFamily:"'DM Mono',monospace"}}>{currentUser.username}</span>
            {currentUser.role==="admin"&&<Pill label="Admin" variant="admin"/>}
            {currentUser.role==="admin"&&<Btn variant="ghost" size="sm" onClick={()=>setView("admin")} style={{color:"#f5d76e",borderColor:"#5a4a1a"}}>⚙ Admin</Btn>}
            <Btn variant="primary" size="sm" onClick={()=>setShowSubmit(true)}>+ File Report</Btn>
            <Btn variant="ghost" size="sm" onClick={handleLogout} style={{color:"#7a6e62",borderColor:"#3a2a1a"}}>Sign Out</Btn>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{background:"#2a2018",padding:"9px 24px",borderBottom:"1px solid #3a3028"}}>
        <div style={{maxWidth:1020,margin:"0 auto",display:"flex",gap:22,flexWrap:"wrap"}}>
          {[["Reports",reports.filter(r=>r.status==="approved").length],["Officers",new Set(reports.filter(r=>r.status==="approved").map(r=>r.badgeNumber)).size],["Counties",new Set(reports.filter(r=>r.status==="approved").map(r=>r.county)).size],["Similar Encounters",reports.reduce((a,r)=>a+r.similarCount,0)]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{color:"#e8c88a",fontSize:17,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{v}</div>
              <div style={{color:"#6a5e52",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout: feed + sidebar */}
      <div style={{maxWidth:1020,margin:"0 auto",padding:"18px 24px 48px",display:"grid",gridTemplateColumns:"1fr 260px",gap:24,alignItems:"start"}}>

        {/* Left: search + feed */}
        <div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
            <div style={{flex:2,minWidth:180,position:"relative"}}>
              <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#9a8e82",fontSize:13}}>🔍</span>
              <input type="text" placeholder="Search by name, badge #, or keyword..." value={search} onChange={e=>setSearch(e.target.value)} style={{...iSt(),paddingLeft:34,width:"100%",boxSizing:"border-box"}}/>
            </div>
            <select value={countyFilter} onChange={e=>setCountyFilter(e.target.value)} style={{...iSt(),flex:1,minWidth:140,cursor:"pointer"}}>
              {COUNTIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 0 12px"}}>
            <span style={{fontSize:11,color:"#8a7e72",fontFamily:"'DM Mono',monospace"}}>{visible.length} report{visible.length!==1?"s":""}</span>
            {(search||countyFilter!=="All Counties")&&<button onClick={()=>{setSearch("");setCountyFilter("All Counties");}} style={{background:"none",border:"none",color:"#c8392b",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Clear</button>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {visible.length===0
              ? <div style={{textAlign:"center",padding:"56px 0",color:"#9a8e82"}}><div style={{fontSize:30,marginBottom:10}}>📋</div><p style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>No reports found.</p></div>
              : visible.map(r=>(
                <div key={r.id} onClick={()=>setSelectedReport(r)} style={{background:"#fff",border:"1px solid #e8e4dc",borderRadius:8,padding:"16px 20px",cursor:"pointer",transition:"transform 0.1s",borderLeft:`3px solid ${r.status==="pending"?"#b8860b":"#c8392b"}`}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
                >
                  <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                    <Avatar name={r.officerName}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:5,alignItems:"center"}}>
                        <span style={{fontWeight:700,fontSize:14,color:"#1a1410",fontFamily:"'Playfair Display',serif"}}>{r.officerName}</span>
                        <Pill label={`#${r.badgeNumber}`} variant="badge"/>
                        <Pill label={r.county} variant="county"/>
                        {r.status==="pending"&&<Pill label="Under Review" variant="pending"/>}
                      </div>
                      <h3 style={{margin:"0 0 5px",fontSize:13,fontWeight:600,color:"#2a2420",lineHeight:1.4}}>{r.title}</h3>
                      <p style={{margin:"0 0 9px",fontSize:12,color:"#6a5e52",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.description}</p>
                      <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"#9a8e82"}}>{timeAgo(r.date)}</span>
                        <span style={{fontSize:11,color:"#7a6e62"}}>💬 {r.comments.filter(c=>c.status==="approved").length}</span>
                        <button onClick={e=>{e.stopPropagation();handleSimilar(r.id);}} style={{background:"#f5ede8",border:"1px solid #e8d8c8",color:"#5c3a2a",borderRadius:4,padding:"3px 9px",fontSize:11,fontWeight:600,cursor:"pointer",marginLeft:"auto",fontFamily:"'DM Mono',monospace"}}>
                          + Similar ({r.similarCount})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Right sidebar: attorney ads */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#2a2018",borderRadius:8,padding:"12px 14px",border:"1px solid #3a3028"}}>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#7a6e62",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.07em"}}>Legal Help</p>
            <p style={{margin:"0 0 10px",fontSize:12,color:"#e8d0b0",lineHeight:1.5}}>Were your rights violated? An attorney may be able to help.</p>
            <button onClick={()=>setView("advertise")} style={{width:"100%",background:"none",border:"1px solid #5a4a1a",color:"#f5d76e",borderRadius:5,padding:"7px",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"0.05em",cursor:"pointer",textTransform:"uppercase"}}>List Your Firm →</button>
          </div>
          {sidebarAds.length===0&&<div style={{background:"#fff",border:"1px dashed #d8d0c8",borderRadius:8,padding:"20px 16px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:11,color:"#b8aea2",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>Attorney listings appear here.<br/>Your firm could be first.</p>
          </div>}
          {sidebarAds.map(a=>(
            <div key={a.id} style={{background:"#fff",border:`1px solid ${a.plan==="featured"||a.plan==="premium"?"#b8860b":"#e8e4dc"}`,borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${a.plan==="featured"||a.plan==="premium"?"#b8860b":"#3a5a3a"}`}}>
              {(a.plan==="featured"||a.plan==="premium")&&<div style={{marginBottom:6}}><Pill label="Featured Attorney" variant="featured"/></div>}
              <p style={{margin:"0 0 3px",fontSize:13,fontWeight:700,color:"#1a1410",fontFamily:"'Playfair Display',serif",lineHeight:1.3}}>{a.firmName}</p>
              {a.tagline&&<p style={{margin:"0 0 5px",fontSize:11,color:"#6a5e52",fontStyle:"italic",lineHeight:1.4}}>"{a.tagline}"</p>}
              {a.specialties&&<p style={{margin:"0 0 7px",fontSize:11,color:"#4a3e32",lineHeight:1.4}}>{a.specialties}</p>}
              {a.phone&&<p style={{margin:"0 0 4px",fontSize:11,color:"#2a3d5c",fontFamily:"'DM Mono',monospace"}}>{a.phone}</p>}
              {a.website&&<a href={a.website} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#c8392b",textDecoration:"none",fontFamily:"'DM Mono',monospace",fontWeight:700}}>Visit Website →</a>}
              <p style={{margin:"8px 0 0",fontSize:10,color:"#b8aea2",fontFamily:"'DM Mono',monospace"}}>Sponsored · {a.county}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedReport&&(
        <Modal onClose={()=>setSelectedReport(null)}>
          <div style={{padding:"24px 24px 0"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:16}}>
              <Avatar name={selectedReport.officerName} size={42}/>
              <div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:3}}>
                  <span style={{fontWeight:800,fontSize:15,fontFamily:"'Playfair Display',serif",color:"#1a1410"}}>{selectedReport.officerName}</span>
                  <Pill label={`Badge #${selectedReport.badgeNumber}`} variant="badge"/>
                  <Pill label={selectedReport.county} variant="county"/>
                </div>
                <span style={{fontSize:11,color:"#9a8e82",fontFamily:"'DM Mono',monospace"}}>{timeAgo(selectedReport.date)} · {selectedReport.date}</span>
              </div>
            </div>
            <h2 style={{margin:"0 0 9px",fontSize:14,fontWeight:700,color:"#1a1410"}}>{selectedReport.title}</h2>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#4a3e32",lineHeight:1.7}}>{selectedReport.description}</p>
            <div style={{background:"#f5ede8",border:"1px solid #e8d8c8",borderRadius:7,padding:"11px 15px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div>
                <span style={{fontSize:19,fontWeight:800,color:"#c8392b",fontFamily:"'DM Mono',monospace"}}>{selectedReport.similarCount}</span>
                <span style={{fontSize:12,color:"#7a4a3a",marginLeft:7}}>people reported a similar encounter</span>
              </div>
              <Btn variant="primary" size="sm" onClick={()=>handleSimilar(selectedReport.id)}>I had a similar encounter</Btn>
            </div>
            {/* Relevant attorney in detail */}
            {ads.filter(a=>a.county===selectedReport.county||a.county==="Statewide — All Counties").slice(0,1).map(a=>(
              <div key={a.id} style={{background:"#f5f0e8",border:"1px solid #e0d0b0",borderRadius:7,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:"#8a7e72",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Attorney in {selectedReport.county}</div>
                  <span style={{fontSize:13,fontWeight:700,color:"#1a1410",fontFamily:"'Playfair Display',serif"}}>{a.firmName}</span>
                  {a.phone&&<span style={{fontSize:11,color:"#2a3d5c",fontFamily:"'DM Mono',monospace",marginLeft:8}}>{a.phone}</span>}
                </div>
                {a.website&&<a href={a.website} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#c8392b",textDecoration:"none",fontFamily:"'DM Mono',monospace",fontWeight:700,flexShrink:0}}>Contact →</a>}
              </div>
            ))}
            <div style={{borderTop:"1px solid #e8e0d4",paddingTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
                <span style={{fontSize:11,fontWeight:700,color:"#2a2018",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"}}>Comments ({selectedReport.comments.filter(c=>c.status==="approved").length})</span>
                <Btn variant="ghost" size="sm" onClick={()=>setShowComment(true)}>+ Comment</Btn>
              </div>
              {selectedReport.comments.filter(c=>c.status==="approved").length===0
                ? <p style={{color:"#9a8e82",fontSize:12,fontStyle:"italic",textAlign:"center",padding:"14px 0"}}>No comments yet.</p>
                : selectedReport.comments.filter(c=>c.status==="approved").map(c=>(
                  <div key={c.id} style={{display:"flex",gap:9,marginBottom:10,padding:"9px 11px",background:"#faf7f4",borderRadius:6,border:"1px solid #ece8e0"}}>
                    <Avatar name={c.author} size={26}/>
                    <div>
                      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:600,color:"#4a3e32"}}>{c.author}</span>
                        <span style={{fontSize:10,color:"#9a8e82",fontFamily:"'DM Mono',monospace"}}>{timeAgo(c.date)}</span>
                      </div>
                      <p style={{margin:0,fontSize:12,color:"#4a3e32",lineHeight:1.6}}>{c.text}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{height:22}}/>
        </Modal>
      )}

      {/* Comment modal */}
      {showComment&&(
        <Modal onClose={()=>setShowComment(false)} maxWidth={480}>
          <div style={{padding:24}}>
            <h3 style={{margin:"0 0 10px",fontFamily:"'Playfair Display',serif",fontSize:16}}>Add a Comment</h3>
            <p style={{margin:"0 0 11px",fontSize:12,color:"#6a5e52"}}>Posting as <strong>{currentUser.username}</strong>.</p>
            <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Describe your experience or observations..." rows={5} style={{...iSt(),resize:"vertical"}}/>
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
              <Btn variant="ghost" size="sm" onClick={()=>setShowComment(false)}>Cancel</Btn>
              <Btn variant="dark" size="sm" onClick={handleAddComment}>Post Comment</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit report modal */}
      {showSubmit&&(
        <Modal onClose={()=>setShowSubmit(false)}>
          <div style={{padding:24}}>
            <h3 style={{margin:"0 0 3px",fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a1410"}}>File an Incident Report</h3>
            <p style={{margin:"0 0 16px",fontSize:12,color:"#8a7e72"}}>Reports are reviewed before publishing. Filing as <strong>{currentUser.username}</strong>.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px 13px"}}>
              {[{k:"officerName",l:"Officer Name",p:"e.g. J. Martinez",full:false},{k:"badgeNumber",l:"Badge Number",p:"e.g. 4821",full:false}].map(({k,l,p,full})=>(
                <div key={k} style={{gridColumn:full?"1 / -1":undefined}}>
                  <label style={lSt}>{l}</label>
                  <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p} style={iSt(formErrors[k])}/>
                  {formErrors[k]&&<span style={{fontSize:11,color:"#c8392b"}}>{formErrors[k]}</span>}
                </div>
              ))}
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>County</label>
                <select value={form.county} onChange={e=>setForm({...form,county:e.target.value})} style={iSt(formErrors.county)}>
                  <option value="">Select county...</option>
                  {COUNTIES.filter(c=>c!=="All Counties").map(c=><option key={c}>{c}</option>)}
                </select>
                {formErrors.county&&<span style={{fontSize:11,color:"#c8392b"}}>{formErrors.county}</span>}
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Incident Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={iSt()}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Incident Title</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Brief summary" style={iSt(formErrors.title)}/>
                {formErrors.title&&<span style={{fontSize:11,color:"#c8392b"}}>{formErrors.title}</span>}
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={lSt}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe what happened in detail..." rows={5} style={{...iSt(formErrors.description),resize:"vertical"}}/>
                {formErrors.description&&<span style={{fontSize:11,color:"#c8392b"}}>{formErrors.description}</span>}
              </div>
            </div>
            <div style={{background:"#f5f0e8",border:"1px solid #e0d8c8",borderRadius:5,padding:"8px 11px",marginTop:12,fontSize:11,color:"#7a6e5a"}}>
              ⚠ Reports are reviewed by moderators. Be factual and accurate. False reports may have legal consequences.
            </div>
            <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
              <Btn variant="ghost" size="sm" onClick={()=>setShowSubmit(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={handleSubmitReport}>Submit Report</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1a1410",color:"#e8e0d4",padding:"10px 20px",borderRadius:8,fontSize:12,fontFamily:"'DM Mono',monospace",zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",border:"1px solid #c8392b"}}>{toast}</div>}
    </div>
  );
}
