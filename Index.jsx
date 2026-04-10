import { useState, useEffect, useRef, useCallback } from "react";

// ─── MONETAG SDK — robust loader with polling ─────────────────────────────────
let sdkState = "idle"; // idle | loading | ready | failed

const loadSdk = () =>
  new Promise((resolve) => {
    if (sdkState === "ready" && typeof window.show_10857361 === "function") {
      resolve(true); return;
    }
    if (sdkState === "loading") {
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (typeof window.show_10857361 === "function") {
          clearInterval(poll); sdkState = "ready"; resolve(true);
        } else if (tries > 40) { clearInterval(poll); resolve(false); }
      }, 250);
      return;
    }
    sdkState = "loading";
    // Remove any existing script first
    document.querySelectorAll('script[data-zone="10857361"]').forEach(s => s.remove());

    const script = document.createElement("script");
    script.src = "https://libtl.com/sdk.js";
    script.setAttribute("data-zone", "10857361");
    script.setAttribute("data-sdk", "show_10857361");
    script.async = true;

    script.onload = () => {
      // SDK registers async, poll for it
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (typeof window.show_10857361 === "function") {
          clearInterval(poll); sdkState = "ready"; resolve(true);
        } else if (tries > 40) {
          clearInterval(poll); sdkState = "failed"; resolve(false);
        }
      }, 250);
    };
    script.onerror = () => { sdkState = "failed"; resolve(false); };
    document.head.appendChild(script);
  });

const fireAd = async () => {
  const ok = await loadSdk();
  if (ok) {
    try { window.show_10857361(); return true; } catch {}
  }
  return false;
};

// ─── DATA ──────────────────────────────────────────────────────────────────────
const TASKS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: ["ওয়েবসাইট ভিজিট করুন","ভিডিও দেখুন","অ্যাপ ডাউনলোড করুন","সার্ভে পূরণ করুন","পেজ লাইক করুন","পোস্ট শেয়ার করুন","রেজিস্ট্রেশন করুন","গেম খেলুন","কুইজ সম্পন্ন করুন","প্রোফাইল আপডেট করুন"][i % 10] + ` #${i + 1}`,
  reward: 0.1, type: "task",
}));
const VIDEOS = Array.from({ length: 20 }, (_, i) => ({
  id: 100 + i + 1, title: `ভিডিও বিজ্ঞাপন #${i + 1}`, reward: 0.1, type: "video",
}));

// ─── THEME ─────────────────────────────────────────────────────────────────────
const G = {
  bg:"#080c14", card:"#0f1623", border:"#1e2a3a",
  green:"#00d97e", gold:"#f5b731", red:"#ff4757", blue:"#00b0ff",
  text:"#e5e7eb", muted:"#5a6a7e",
  grad:"linear-gradient(135deg,#00d97e,#00b0ff)",
};
const S = {
  app:{ minHeight:"100vh", background:G.bg, fontFamily:"'Segoe UI',system-ui,sans-serif", color:G.text },
  card:{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:"14px 16px", marginBottom:10 },
  input:{ width:"100%", background:"#141d2b", border:`1px solid ${G.border}`, borderRadius:8, padding:"11px 14px", color:G.text, fontSize:14, marginBottom:12, boxSizing:"border-box", outline:"none" },
  btn:(c=G.green)=>({ background:c, border:`2px solid ${c}`, color:"#000", borderRadius:8, padding:"8px 18px", fontWeight:700, cursor:"pointer", fontSize:13 }),
  tab:(a)=>({ flex:1, padding:"10px 0", background:a?G.green:"transparent", color:a?"#000":G.muted, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", borderRadius:8, transition:"all .2s" }),
  badge:(c)=>({ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }),
};

// ─── AUTH ──────────────────────────────────────────────────────────────────────
function Auth({ onLogin }) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);

  const submit = async () => {
    setErr(""); setBusy(true);
    if (!email||!pass) { setErr("সব ঘর পূরণ করুন"); setBusy(false); return; }
    const key = `user:${email.toLowerCase().trim()}`;
    if (mode==="signup") {
      if (!name) { setErr("নাম দিন"); setBusy(false); return; }
      try { await window.storage.get(key); setErr("এই ইমেইল আগে থেকেই আছে"); setBusy(false); return; } catch {}
      const u = { name, email:email.toLowerCase().trim(), pass, completedIds:[], balance:0 };
      await window.storage.set(key, JSON.stringify(u));
      onLogin(u);
    } else {
      try {
        const r = await window.storage.get(key);
        const u = JSON.parse(r.value);
        if (u.pass!==pass) { setErr("পাসওয়ার্ড ভুল"); setBusy(false); return; }
        onLogin(u);
      } catch { setErr("অ্যাকাউন্ট পাওয়া যায়নি"); }
    }
    setBusy(false);
  };

  return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:44,marginBottom:8}}>💰</div>
          <div style={{fontSize:26,fontWeight:900,background:G.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>EarnBD</div>
          <div style={{color:G.muted,fontSize:13,marginTop:4}}>Task করুন · টাকা আয় করুন</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:20,background:G.card,borderRadius:10,padding:4}}>
          <button style={S.tab(mode==="login")} onClick={()=>setMode("login")}>লগইন</button>
          <button style={S.tab(mode==="signup")} onClick={()=>setMode("signup")}>সাইনআপ</button>
        </div>
        {mode==="signup"&&<input style={S.input} placeholder="আপনার নাম" value={name} onChange={e=>setName(e.target.value)}/>}
        <input style={S.input} placeholder="Gmail ঠিকানা" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={S.input} placeholder="পাসওয়ার্ড" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
        {err&&<div style={{color:G.red,fontSize:13,marginBottom:10,textAlign:"center"}}>{err}</div>}
        <button style={{...S.btn(),width:"100%",padding:13,fontSize:15}} onClick={submit} disabled={busy}>
          {busy?"অপেক্ষা করুন…":mode==="login"?"লগইন করুন":"অ্যাকাউন্ট তৈরি করুন"}
        </button>
      </div>
    </div>
  );
}

// ─── TASK ITEM ─────────────────────────────────────────────────────────────────
function TaskItem({ item, done, onClaim }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | counting
  const [secs, setSecs] = useState(0);
  const iv = useRef(null);

  const claim = async () => {
    if (done || phase !== "idle") return;
    setPhase("loading");
    await fireAd();                          // fire ad, don't block on success
    const wait = item.type === "video" ? 15 : 5;
    setSecs(wait); setPhase("counting");
    let t = wait;
    iv.current = setInterval(() => {
      t--;
      setSecs(t);
      if (t <= 0) { clearInterval(iv.current); setPhase("idle"); onClaim(item); }
    }, 1000);
  };
  useEffect(() => () => clearInterval(iv.current), []);

  const color = item.type === "video" ? G.gold : G.green;

  return (
    <div style={{...S.card,display:"flex",alignItems:"center",gap:12,opacity:done?0.5:1}}>
      <span style={{fontSize:22}}>{done?"✅":item.type==="video"?"🎬":"📌"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
        <div style={{fontSize:12,color:G.muted,marginTop:2}}>পুরস্কার: <span style={{color:G.gold,fontWeight:700}}>৳{item.reward.toFixed(2)}</span></div>
      </div>
      {done ? <span style={S.badge(G.green)}>সম্পন্ন</span>
        : phase==="loading" ? <span style={{...S.badge(G.blue),minWidth:70,textAlign:"center"}}>🔄 লোড…</span>
        : phase==="counting" ? <span style={{...S.badge(color),minWidth:70,textAlign:"center"}}>⏳ {secs}s</span>
        : <button style={S.btn(color)} onClick={claim}>ক্লেম</button>}
    </div>
  );
}

// ─── WITHDRAW MODAL ────────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onWithdraw }) {
  const [method,setMethod]=useState("bkash"); const [num,setNum]=useState(""); const [err,setErr]=useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{...S.card,width:"100%",maxWidth:360,borderColor:G.green+"88"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:16}}>💸 উত্তোলন</div>
          <button style={{background:"none",border:"none",color:G.muted,fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
        </div>
        <div style={{fontSize:32,fontWeight:900,color:G.gold}}>৳{Math.min(balance,100).toFixed(2)}</div>
        <div style={{fontSize:12,color:G.muted,marginBottom:16}}>উত্তোলনযোগ্য পরিমাণ</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["bkash","🟣 বিকাশ","#e2136e"],["nagad","🟠 নগদ","#f15a22"]].map(([k,l,c])=>(
            <button key={k} onClick={()=>setMethod(k)}
              style={{flex:1,padding:"11px 0",background:method===k?c+"33":"transparent",border:`2px solid ${method===k?c:G.border}`,borderRadius:8,color:method===k?c:G.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <input style={S.input} placeholder="01XXXXXXXXX" value={num} onChange={e=>setNum(e.target.value)} type="tel"/>
        {err&&<div style={{color:G.red,fontSize:13,marginBottom:10}}>{err}</div>}
        <button style={{...S.btn(G.green),width:"100%",padding:13,fontSize:14}}
          onClick={()=>{ if(!num||num.length<11){setErr("সঠিক নম্বর দিন");return;} onWithdraw(method,num); }}>
          নিশ্চিত করুন ✅
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("tasks");
  const [doneIds,setDoneIds]=useState([]);
  const [balance,setBalance]=useState(0);
  const [showW,setShowW]=useState(false);
  const [history,setHistory]=useState([]);
  const [toast,setToast]=useState("");

  // Pre-warm SDK on mount
  useEffect(()=>{ loadSdk(); },[]);

  useEffect(()=>{
    if (!user) return;
    setDoneIds(user.completedIds||[]);
    setBalance(user.balance||0);
    window.storage.get("wd-history",true)
      .then(r=>setHistory(JSON.parse(r.value)))
      .catch(()=>setHistory([]));
  },[user]);

  const flash = msg=>{ setToast(msg); setTimeout(()=>setToast(""),2800); };
  const persist = async u => window.storage.set(`user:${u.email}`,JSON.stringify(u));

  const handleClaim = useCallback(async item=>{
    if (doneIds.includes(item.id)) return;
    const ids=[...doneIds,item.id];
    const bal=+(balance+item.reward).toFixed(2);
    const u={...user,completedIds:ids,balance:bal};
    setDoneIds(ids); setBalance(bal); setUser(u);
    await persist(u);
    flash(`+৳${item.reward.toFixed(2)} যোগ হয়েছে! 🎉`);
  },[doneIds,balance,user]);

  const handleWithdraw = async(method,num)=>{
    const amt=Math.min(balance,100), bal=+(balance-amt).toFixed(2);
    const entry={ user:user.name, method, number:num.slice(0,4)+"***"+num.slice(-3), amount:amt, time:new Date().toLocaleString("bn-BD"), id:Date.now() };
    const h=[entry,...history].slice(0,100);
    setHistory(h); setBalance(bal);
    const u={...user,balance:bal}; setUser(u);
    await persist(u);
    await window.storage.set("wd-history",JSON.stringify(h),true);
    setShowW(false);
    flash(`৳${amt} উত্তোলন সফল! ✅`);
  };

  if (!user) return <Auth onLogin={setUser}/>;

  const prog=Math.min((doneIds.length/1000)*100,100);
  const list=tab==="tasks"?TASKS:tab==="video"?VIDEOS:[...TASKS,...VIDEOS];

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={{background:"linear-gradient(90deg,#0a1220,#0d1f30)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${G.border}`,position:"sticky",top:0,zIndex:100}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,background:G.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>💰 EarnBD</div>
          <div style={{fontSize:11,color:G.muted}}>{user.name}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:20,fontWeight:900,color:G.gold}}>৳{balance.toFixed(2)}</div>
          <div style={{fontSize:11,color:G.muted}}>{doneIds.length}/1000 টাস্ক</div>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {/* Balance card */}
        <div style={{background:"linear-gradient(135deg,#0b1e12,#0a1428)",border:`1px solid ${G.green}33`,borderRadius:14,padding:16,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:G.muted}}>মোট ব্যালেন্স</div>
              <div style={{fontSize:34,fontWeight:900,color:G.gold,lineHeight:1.1}}>৳{balance.toFixed(2)}</div>
            </div>
            <button style={{...S.btn(G.green),padding:"10px 18px",fontSize:14,opacity:balance>=100?1:0.35,cursor:balance>=100?"pointer":"not-allowed"}}
              onClick={()=>balance>=100&&setShowW(true)}>💸 উত্তোলন</button>
          </div>
          <div style={{fontSize:12,color:G.muted,marginBottom:6}}>{doneIds.length}/1000 টাস্ক সম্পন্ন ({prog.toFixed(1)}%)</div>
          <div style={{height:10,background:"#141d2b",borderRadius:5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${prog}%`,background:G.grad,borderRadius:5,transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:11,color:G.muted,marginTop:6}}>১০০০ টাস্ক = ১০০ টাকা · বিকাশ ও নগদে উত্তোলন</div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:12,background:G.card,borderRadius:10,padding:4}}>
          {[["tasks","📋 টাস্ক (50)"],["video","🎬 ভিডিও (20)"],["history","📜 হিস্ট্রি"]].map(([k,l])=>(
            <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {tab!=="history" ? (
          <>
            <div style={{fontSize:12,color:G.muted,marginBottom:10}}>
              ক্লেম বাটনে চাপুন → বিজ্ঞাপন → পুরস্কার পান
              <span style={{float:"right",color:G.green,fontWeight:700}}>{list.filter(i=>doneIds.includes(i.id)).length}/{list.length} ✓</span>
            </div>
            {list.map(item=>(
              <TaskItem key={item.id} item={item} done={doneIds.includes(item.id)} onClaim={handleClaim}/>
            ))}
          </>
        ) : (
          <>
            <div style={{fontSize:13,fontWeight:700,color:G.muted,marginBottom:10}}>📜 সকলের উত্তোলন হিস্ট্রি</div>
            {history.length===0 ? (
              <div style={{textAlign:"center",color:G.muted,padding:"50px 0"}}>এখনো কোনো উত্তোলন হয়নি</div>
            ) : history.map(h=>(
              <div key={h.id} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{h.user}</div>
                  <div style={{fontSize:12,color:G.muted}}>{h.method==="bkash"?"🟣 বিকাশ":"🟠 নগদ"} · {h.number}</div>
                  <div style={{fontSize:11,color:G.muted}}>{h.time}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:900,color:G.gold}}>৳{h.amount}</div>
                  <span style={S.badge(G.green)}>✓ সফল</span>
                </div>
              </div>
            ))}
          </>
        )}
        <div style={{height:40}}/>
      </div>

      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:G.green,color:"#000",fontWeight:800,padding:"11px 24px",borderRadius:30,fontSize:14,zIndex:300,whiteSpace:"nowrap",boxShadow:"0 4px 20px #00d97e55"}}>
          {toast}
        </div>
      )}

      {showW&&<WithdrawModal balance={balance} onClose={()=>setShowW(false)} onWithdraw={handleWithdraw}/>}
    </div>
  );
      }
          
