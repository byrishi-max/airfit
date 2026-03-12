import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClientPlan } from "../hooks/useClientPlan";
import { ENDPOINTS } from "../utils/config";

const SHARED = [
    { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Rahul Sharma" },
    { key: "email", label: "Email Address", type: "email", placeholder: "you@gmail.com" },
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
    { key: "age", label: "Age", type: "number", placeholder: "25", unit: "yrs" },
    { key: "height", label: "Height", type: "number", placeholder: "170", unit: "cm" },
    { key: "weight", label: "Weight", type: "number", placeholder: "70", unit: "kg" },
    { key: "bodyFat", label: "Body Fat %", type: "number", placeholder: "18", unit: "%", optional: true },
];

const DIET_QUESTIONS = [
    { key: "goal", label: "Primary Goal", type: "select", options: ["Fat Loss", "Muscle Gain", "Maintenance", "Medical / Therapeutic"] },
    { key: "activityLevel", label: "Activity Level", type: "select", options: ["Sedentary (desk job)", "Lightly Active", "Moderately Active", "Very Active", "Athlete"] },
    { key: "dietPreference", label: "Diet Preference", type: "select", options: ["Vegetarian", "Eggetarian", "Non-Vegetarian", "Vegan"] },
    { key: "foodCulture", label: "Food Culture", type: "select", options: ["Indian Home Food", "South Indian", "North Indian", "PG / Hostel Food", "Mixed / No Preference"] },
    { key: "mealsPerDay", label: "Meals per Day", type: "select", options: ["2", "3", "4", "5", "6"] },
    { key: "allergies", label: "Allergies / Medical Conditions", type: "text", placeholder: "e.g. lactose intolerant, diabetes...", optional: true },
    { key: "previousWorkout", label: "Workout History", type: "select", options: ["Complete Beginner", "Was active 3 months ago", "Was active 6 months ago", "Was active 8+ months ago", "Currently Training"] },
    { key: "wakeTime", label: "Wake-up Time", type: "select", options: ["5–6 AM", "6–7 AM", "7–8 AM", "8–9 AM", "After 9 AM"] },
];

const WORKOUT_QUESTIONS = [
    { key: "goal", label: "Training Goal", type: "select", options: ["Build Muscle", "Lose Fat", "Increase Strength", "Improve Endurance", "Athletic Performance", "General Fitness"] },
    { key: "activityLevel", label: "Current Fitness", type: "select", options: ["Complete Beginner", "Some Experience (< 6 months)", "Intermediate (6–18 months)", "Advanced (2+ years)"] },
    { key: "gymAccess", label: "Gym Access", type: "select", options: ["Full Gym (all equipment)", "Home Gym (dumbbells/barbell)", "Bodyweight Only", "Resistance Bands"] },
    { key: "daysPerWeek", label: "Days Available", type: "select", options: ["3 days", "4 days", "5 days", "6 days"] },
    { key: "sessionLength", label: "Session Duration", type: "select", options: ["30–45 min", "45–60 min", "60–75 min", "75–90 min"] },
    { key: "injuries", label: "Injuries / Limitations", type: "text", placeholder: "e.g. knee pain, lower back issue...", optional: true },
    { key: "previousWorkout", label: "Previous Training", type: "select", options: ["Never trained", "Trained before, stopped 3 months ago", "Trained before, stopped 6+ months ago", "Currently training but inconsistent"] },
    { key: "focusArea", label: "Focus Area", type: "select", options: ["Full Body", "Upper Body", "Lower Body", "Core & Abs", "No Preference"] },
];

const TOTAL_STEPS = 5;

const css = `
  .q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .q-grid-review { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; }
  @media (max-width: 600px) {
    .q-grid, .q-grid-review { grid-template-columns: 1fr !important; }
  }
  .q-input-wrap { position: relative; }
  .q-field-unit {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-size: 11px; color: #777; font-weight: 600; pointer-events: none; letter-spacing: 1px;
  }
  .q-input, .q-select {
    width: 100%; background: #111; border: 1.5px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 13px 16px; color: #f0ede8; font-family: inherit;
    font-size: 14px; font-weight: 400; outline: none; transition: all 0.2s;
    appearance: none; -webkit-appearance: none; box-sizing: border-box;
  }
  .q-input:focus, .q-select:focus {
    border-color: #FF6B00; background: #1a1a1a;
    box-shadow: 0 0 0 3px rgba(255,107,0,0.12);
  }
  .q-input::placeholder { color: #444; font-weight: 300; }
  .q-select {
    cursor: pointer; padding-right: 36px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  .q-select option { background: #1a1a1a; color: #fff; }
`;

function Questionnaire({ planType, client, onCancel }) {
    const navigate = useNavigate();
    const { markPending } = useClientPlan(client.clientId);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        clientId: client.clientId,
        planType: planType,
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",   // ← required by n8n
        gender: "", age: "", height: "", weight: "", bodyFat: "",
        goal: "", activityLevel: "", dietPreference: "", foodCulture: "",
        mealsPerDay: "", allergies: "", previousWorkout: "", wakeTime: "",
        gymAccess: "", daysPerWeek: "", sessionLength: "", injuries: "", focusArea: "",
    });

    const wrapRef = useRef(null);
    const isDiet = planType === "Diet Plan";
    const specificQ = isDiet ? DIET_QUESTIONS : WORKOUT_QUESTIONS;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const scrollTop = () => wrapRef.current?.scrollTo(0, 0);

    const canNext = () => {
        if (step === 1) return form.name && form.email && form.gender && form.age;
        if (step === 2) return form.height && form.weight;
        if (step === 3) return specificQ.slice(0, 4).filter(q => !q.optional).every(q => !!form[q.key]);
        if (step === 4) return specificQ.slice(4).filter(q => !q.optional).every(q => !!form[q.key]);
        return true;
    };

    const next = () => { if (canNext()) { setStep(s => s + 1); scrollTop(); } };
    const back = () => step > 1 ? (setStep(s => s - 1), scrollTop()) : onCancel();

    const submit = async () => {
        setLoading(true);
        try {
            await fetch(ENDPOINTS.SUBMIT_PLAN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
        } catch (e) {
            // Fire-and-forget — proceed anyway
        }
        markPending();
        setLoading(false);
        navigate('/client/waiting');
    };

    const renderFields = (fields) => (
        <div className="q-grid">
            <style>{css}</style>
            {fields.map(f => (
                <div key={f.key} style={{ gridColumn: (f.key === 'injuries' || f.key === 'allergies') ? '1 / -1' : 'auto' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: '#777', marginBottom: '8px' }}>
                        {f.label}
                        {f.optional && <span style={{ fontSize: '9px', color: '#444', letterSpacing: '1px', fontWeight: '400' }}>optional</span>}
                    </label>
                    <div className="q-input-wrap">
                        {f.type === "select" ? (
                            <select className="q-select" value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                                <option value="">Select...</option>
                                {f.options.map(o => <option key={o}>{o}</option>)}
                            </select>
                        ) : (
                            <input className="q-input" type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={f.unit ? { paddingRight: "48px" } : {}} />
                        )}
                        {f.unit && <span className="q-field-unit">{f.unit}</span>}
                    </div>
                </div>
            ))}
        </div>
    );

    const stepTitles = [
        "Tell us about yourself",
        "Your measurements",
        isDiet ? "Food & lifestyle" : "Your training setup",
        isDiet ? "Fine-tune your nutrition" : "Fine-tune your program",
        "Review & submit"
    ];

    return (
        <div ref={wrapRef} style={{ background: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', padding: '40px', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
            {/* Step indicator */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#FF5C1A', marginBottom: '8px' }}>
                    Step 0{step} of {TOTAL_STEPS}
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '28px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {stepTitles[step - 1]}
                </h2>
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div key={i} style={{
                            height: '3px', flex: 1, borderRadius: '2px',
                            background: i < step ? '#FF5C1A' : '#2a2a2a',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>
            </div>

            {step === 1 && renderFields(SHARED.slice(0, 4))}
            {step === 2 && renderFields(SHARED.slice(4))}
            {step === 3 && renderFields(specificQ.slice(0, 4))}
            {step === 4 && renderFields(specificQ.slice(4))}

            {step === 5 && (
                <div className="q-grid-review">
                    {[
                        ["Plan", form.planType],
                        ["Phone", form.phone],
                        ...SHARED.map(q => [q.label, form[q.key] ? `${form[q.key]} ${q.unit || ""}`.trim() : ""]),
                        ...specificQ.map(q => [q.label, form[q.key]])
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '14px 16px', background: '#111' }}>
                            <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: '#777' }}>{k}</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{v || "—"}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button onClick={back} style={{
                    padding: '14px 20px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.07)', background: 'transparent',
                    color: '#888', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Sora', sans-serif"
                }}>
                    {step === 1 ? 'Cancel' : '← Back'}
                </button>
                {step < TOTAL_STEPS ? (
                    <button onClick={next} disabled={!canNext()} style={{
                        flex: 1, padding: '15px 24px', borderRadius: '8px', border: 'none',
                        background: canNext() ? 'linear-gradient(135deg, #FF6B00 0%, #ff4500 100%)' : '#2a2a2a',
                        color: canNext() ? '#fff' : '#666', fontSize: '15px', fontWeight: '700',
                        cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily: "'Sora', sans-serif"
                    }}>
                        Continue →
                    </button>
                ) : (
                    <button onClick={submit} disabled={loading} style={{
                        flex: 1, padding: '15px 24px', borderRadius: '8px', border: 'none',
                        background: loading ? '#2a2a2a' : 'linear-gradient(135deg, #FF6B00 0%, #ff4500 100%)',
                        color: loading ? '#666' : '#fff', fontSize: '15px', fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Sora', sans-serif"
                    }}>
                        {loading ? '✈️ Submitting...' : '🚀 Generate My Plan'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default Questionnaire;
