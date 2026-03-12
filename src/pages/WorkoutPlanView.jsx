import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import DayTabs from '../components/DayTabs';
import ExerciseCard from '../components/ExerciseCard';
import ProgressBar from '../components/ProgressBar';

/* ── Background image URL (Unsplash – fitness / dark gym aesthetic) ── */
const HERO_BG = '/gym-hero-bg.png';

/* ── Inline keyframes injected once ── */
const KEYFRAMES = `
@keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }
@keyframes pulse    { 0%,100%{ opacity:.55 } 50%{ opacity:1 } }
@keyframes glow     { 0%,100%{ box-shadow:0 0 20px rgba(255,91,26,.15) } 50%{ box-shadow:0 0 40px rgba(255,91,26,.35) } }
@keyframes shimmer  { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
@keyframes float    { 0%,100%{ transform:translateY(0px) } 50%{ transform:translateY(-6px) } }
`;

/**
 * Parse plan JSON — handles double-stringify from n8n.
 */
function ensureParsed(plan) {
    if (!plan) return null;
    if (typeof plan === 'object' && plan.days) return plan;
    if (typeof plan === 'string') {
        try {
            let p = JSON.parse(plan);
            if (typeof p === 'string') p = JSON.parse(p);
            return p;
        } catch { return null; }
    }
    return plan;
}

/** Normalize day names. */
const DAY_MAP = {
    'mon':'Monday','monday':'Monday','tue':'Tuesday','tuesday':'Tuesday','tues':'Tuesday',
    'wed':'Wednesday','wednesday':'Wednesday','thu':'Thursday','thursday':'Thursday',
    'thur':'Thursday','thurs':'Thursday','fri':'Friday','friday':'Friday',
    'sat':'Saturday','saturday':'Saturday','sun':'Sunday','sunday':'Sunday',
    'day 1':'Monday','day 2':'Tuesday','day 3':'Wednesday',
    'day 4':'Thursday','day 5':'Friday','day 6':'Saturday',
};
function normDay(n){ return n ? (DAY_MAP[n.toLowerCase().trim()]||n) : n; }

/* ── Motivational quote bank ── */
const QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Push yourself because no one else will.",
    "Discipline is choosing what you want most over what you want now.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "Sweat is fat crying.",
    "The pain you feel today will be the strength you feel tomorrow.",
];

export default function WorkoutPlanView() {
    const { client } = useClientAuth();
    const { workoutPlan: rawPlan } = useClientPlan(client?.clientId);
    const navigate = useNavigate();

    const [week, setWeek]       = useState(1);
    const [activeDay, setActiveDay] = useState('Monday');
    const [scrolled, setScrolled]   = useState(false);

    // Random motivational quote (stable per session)
    const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

    // Track scroll for sticky header glow
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 120);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    // Inject keyframes once
    useEffect(() => {
        if (!document.getElementById('airfit-kf')) {
            const s = document.createElement('style');
            s.id = 'airfit-kf';
            s.textContent = KEYFRAMES;
            document.head.appendChild(s);
        }
    }, []);

    const workoutPlan = useMemo(() => ensureParsed(rawPlan), [rawPlan]);

    const handleRegenerate = useCallback(() => {
        if (!client?.clientId) return;
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const idx = clients.findIndex(c => c.clientId === client.clientId);
        if (idx !== -1) {
            clients[idx].planStatus = 'none';
            clients[idx].workoutPlan = null;
            clients[idx].dietPlan = null;
            localStorage.setItem('airfit_clients', JSON.stringify(clients));
        }
        navigate('/client/dashboard');
    }, [client, navigate]);

    /* ── No plan fallback ── */
    if (!client || !workoutPlan || !workoutPlan.days) {
        return (
            <div style={{ minHeight:'100vh', background:'#060606', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ textAlign:'center', animation:'fadeUp .5s ease both', maxWidth:400, padding:'0 24px' }}>
                    <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
                    <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, marginBottom:10 }}>Plan Not Available</h2>
                    <p style={{ color:'#777', fontSize:14, lineHeight:1.6, marginBottom:28 }}>
                        Your plan couldn't be loaded. The AI generation may have failed.
                    </p>
                    <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                        <button onClick={handleRegenerate} style={{
                            padding:'14px 28px', background:'linear-gradient(135deg,#FF6B00,#ff4500)',
                            color:'#fff', border:'none', borderRadius:10, cursor:'pointer',
                            fontSize:14, fontWeight:700, fontFamily:"'Sora',sans-serif"
                        }}>🔄 Generate New Plan</button>
                        <button onClick={()=>navigate('/client/dashboard')} style={{
                            padding:'14px 28px', background:'#191919', color:'#888',
                            border:'1px solid #2a2a2a', borderRadius:10, cursor:'pointer',
                            fontSize:14, fontWeight:600, fontFamily:"'Sora',sans-serif"
                        }}>← Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    const days = (workoutPlan.days || []).map(d => ({ ...d, day: normDay(d.day) }));
    const totalExercises = days.reduce((s, d) => s + (d.exercises?.length || 0), 0);
    const currentDayPlan = days.find(d => d.day === activeDay);
    const exercises = currentDayPlan?.exercises || [];
    const firstName = client.name?.split(' ')[0] || 'Champ';

    return (
        <div style={{ minHeight:'100vh', background:'#060606', color:'#F0EDE8' }}>

            {/* ═══════════════ CINEMATIC HERO SECTION ═══════════════ */}
            <div style={{
                position:'relative', overflow:'hidden',
                minHeight: 380, display:'flex', flexDirection:'column', justifyContent:'flex-end',
            }}>
                {/* Background Image */}
                <div style={{
                    position:'absolute', inset:0,
                    backgroundImage:`url(${HERO_BG})`,
                    backgroundSize:'cover', backgroundPosition:'center 30%',
                    filter:'brightness(0.5) saturate(1.3)',
                    transform:'scale(1.05)', /* slight zoom for cinematic feel */
                }} />

                {/* Orange radial glow overlay — matches reference image aesthetic */}
                <div style={{
                    position:'absolute', inset:0,
                    background:'radial-gradient(ellipse at 50% 60%, rgba(255,91,26,0.25) 0%, rgba(255,60,0,0.08) 40%, transparent 70%)',
                }} />

                {/* Bottom fade to black */}
                <div style={{
                    position:'absolute', bottom:0, left:0, right:0, height:'60%',
                    background:'linear-gradient(to top, #060606 0%, rgba(6,6,6,0.85) 40%, transparent 100%)',
                }} />

                {/* Top nav over hero */}
                <header style={{
                    position:'absolute', top:0, left:0, right:0, zIndex:10,
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'20px 24px',
                    background: scrolled ? 'rgba(6,6,6,0.92)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    transition:'all 0.3s ease',
                }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <button onClick={()=>navigate('/client/dashboard')} style={{
                            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
                            color:'#ccc', cursor:'pointer', padding:'8px 14px', borderRadius:8,
                            fontSize:13, fontWeight:600, backdropFilter:'blur(4px)',
                            transition:'all 0.2s',
                        }}
                            onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.15)'; e.target.style.color='#fff'; }}
                            onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.08)'; e.target.style.color='#ccc'; }}
                        >← Back</button>
                        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700, margin:0, letterSpacing:'0.5px' }}>
                            AIRFIT<span style={{ color:'#FF5C1A' }}>.</span>
                        </h1>
                    </div>
                    <Link to="/client/progress" style={{
                        background:'rgba(255,92,26,0.12)', color:'#FF5C1A', textDecoration:'none',
                        padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700,
                        border:'1px solid rgba(255,92,26,0.2)',
                        transition:'all 0.2s',
                    }}
                        onMouseEnter={e => { e.target.style.background='rgba(255,92,26,0.25)'; }}
                        onMouseLeave={e => { e.target.style.background='rgba(255,92,26,0.12)'; }}
                    >📊 Progress</Link>
                </header>

                {/* Hero content */}
                <div style={{ position:'relative', zIndex:5, padding:'0 28px 36px', maxWidth:650, animation:'fadeUp 0.7s ease both' }}>
                    {/* Glowing accent line */}
                    <div style={{
                        width:48, height:3, borderRadius:2,
                        background:'linear-gradient(90deg, #FF5C1A, #ff8c42)',
                        marginBottom:16, animation:'glow 3s ease-in-out infinite',
                    }} />
                    <div style={{
                        fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase',
                        color:'#FF5C1A', marginBottom:12,
                        textShadow:'0 0 20px rgba(255,92,26,0.4)',
                    }}>
                        6-DAY WORKOUT PLAN
                    </div>
                    <h2 style={{
                        fontFamily:"'Sora',sans-serif", fontSize:'clamp(24px, 5vw, 34px)',
                        fontWeight:800, lineHeight:1.15, marginBottom:14,
                        background:'linear-gradient(135deg, #ffffff 0%, #e0d6cc 100%)',
                        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    }}>
                        {workoutPlan.greeting || `Let's go, ${firstName}!`}
                    </h2>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, lineHeight:1.7, maxWidth:480 }}>
                        {workoutPlan.overview || 'Here is your personalized training program.'}
                    </p>

                    {/* Motivational quote chip */}
                    <div style={{
                        marginTop:20, display:'inline-flex', alignItems:'center', gap:8,
                        padding:'8px 16px', borderRadius:20,
                        background:'rgba(255,92,26,0.06)', border:'1px solid rgba(255,92,26,0.12)',
                        animation:'float 4s ease-in-out infinite',
                    }}>
                        <span style={{ fontSize:14 }}>🔥</span>
                        <span style={{ color:'rgba(255,255,255,0.45)', fontSize:12, fontStyle:'italic', fontWeight:500 }}>
                            "{quote}"
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <main style={{ maxWidth:620, margin:'0 auto', padding:'28px 24px 100px' }}>

                {/* Broken plan warning */}
                {totalExercises === 0 && (
                    <div style={{
                        background:'rgba(255,92,26,0.06)', border:'1px solid rgba(255,92,26,0.15)',
                        borderRadius:14, padding:20, marginBottom:24, textAlign:'center',
                        animation:'fadeUp .4s ease both',
                    }}>
                        <p style={{ color:'#FF5C1A', fontSize:14, fontWeight:600, marginBottom:8 }}>
                            ⚠️ Plan generation may have been incomplete
                        </p>
                        <p style={{ color:'#777', fontSize:13, lineHeight:1.5, marginBottom:16 }}>
                            Your exercises didn't load properly. Try regenerating.
                        </p>
                        <button onClick={handleRegenerate} style={{
                            padding:'10px 24px', background:'#FF5C1A', color:'#fff',
                            border:'none', borderRadius:8, cursor:'pointer',
                            fontSize:13, fontWeight:700, fontFamily:"'Sora',sans-serif",
                        }}>🔄 Regenerate Plan</button>
                    </div>
                )}

                {/* ── Week Selector ── */}
                <div style={{ display:'flex', gap:8, marginBottom:20, animation:'fadeUp 0.5s ease 0.1s both' }}>
                    {[1,2,3,4].map(w => (
                        <button key={w} onClick={()=>setWeek(w)} style={{
                            flex:1, padding:'12px 0', borderRadius:10, cursor:'pointer',
                            background: week===w
                                ? 'linear-gradient(135deg, rgba(255,92,26,0.15), rgba(255,92,26,0.05))'
                                : 'rgba(255,255,255,0.03)',
                            border: week===w ? '1px solid rgba(255,92,26,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            color: week===w ? '#FF5C1A' : '#555',
                            fontSize:12, fontWeight:700, fontFamily:"'Sora',sans-serif",
                            transition:'all 0.25s ease',
                            ...(week===w ? { boxShadow:'0 4px 20px rgba(255,92,26,0.1)' } : {}),
                        }}
                            onMouseEnter={e => { if(week!==w) e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.color = week===w ? '#FF5C1A' : '#888'; }}
                            onMouseLeave={e => { if(week!==w) e.target.style.borderColor='rgba(255,255,255,0.06)'; e.target.style.color = week===w ? '#FF5C1A' : '#555'; }}
                        >
                            Week {w}
                        </button>
                    ))}
                </div>

                {/* ── Day Tabs ── */}
                <div style={{ animation:'fadeUp 0.5s ease 0.2s both' }}>
                    <DayTabs days={days} activeDay={activeDay} onChange={setActiveDay} />
                </div>

                {/* ── Exercises or Rest Day ── */}
                {exercises.length > 0 ? (
                    <div key={activeDay} style={{ animation:'fadeUp 0.4s ease both' }}>
                        {/* Muscle group header */}
                        <div style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            marginBottom:16, marginTop:4,
                        }}>
                            <h3 style={{
                                fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700,
                                display:'flex', alignItems:'center', gap:10,
                            }}>
                                <span style={{
                                    display:'inline-block', width:4, height:22, borderRadius:2,
                                    background:'linear-gradient(180deg, #FF5C1A, #ff8c42)',
                                }} />
                                {currentDayPlan.muscle || 'Training Day'}
                            </h3>
                            <span style={{
                                fontSize:11, color:'#555', fontWeight:600,
                                background:'rgba(255,255,255,0.04)', padding:'4px 10px', borderRadius:6,
                            }}>
                                {exercises.length} exercises
                            </span>
                        </div>

                        <ProgressBar clientId={client.clientId} weekNumber={week} day={activeDay} exercises={exercises} />

                        <div style={{ marginTop:20 }}>
                            {exercises.map((ex, i) => (
                                <div key={i} style={{ animation:`slideIn 0.35s ease ${i*0.06}s both` }}>
                                    <ExerciseCard
                                        exercise={ex}
                                        clientId={client.clientId}
                                        weekNumber={week}
                                        day={activeDay}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        textAlign:'center', padding:'48px 24px', marginTop:8,
                        background:'radial-gradient(ellipse at center, rgba(255,92,26,0.04) 0%, rgba(255,255,255,0.01) 70%)',
                        borderRadius:16, border:'1px dashed rgba(255,255,255,0.08)',
                        animation:'fadeUp .4s ease both',
                    }}>
                        <div style={{ fontSize:48, marginBottom:16, animation:'float 3s ease-in-out infinite' }}>🛌</div>
                        <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, marginBottom:8 }}>Rest & Recovery</h3>
                        <p style={{ color:'#666', fontSize:14, lineHeight:1.7, maxWidth:320, margin:'0 auto' }}>
                            Your muscles grow during rest. Stay hydrated, stretch, and get 8 hours of sleep.
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
}
