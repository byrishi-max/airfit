import React from 'react';

export default function DayTabs({ days, activeDay, onChange }) {
    const shortDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    return (
        <div style={{
            display: 'flex', overflowX: 'auto', gap: '8px',
            paddingBottom: '12px', marginBottom: '20px',
            borderBottom: '1px solid #2a2a2a',
            scrollbarWidth: 'none' // Firefox
        }}>
            <style>{`
        .day-tabs-container::-webkit-scrollbar { display: none; }
      `}</style>

            {shortDays.map((d, index) => {
                const fullDayName = index === 0 ? 'Monday' :
                    index === 1 ? 'Tuesday' :
                        index === 2 ? 'Wednesday' :
                            index === 3 ? 'Thursday' :
                                index === 4 ? 'Friday' :
                                    index === 5 ? 'Saturday' : 'Sunday';

                // Check if there are exercises for this day in the plan
                const hasWorkout = days.some(planDay => planDay.day === fullDayName && planDay.exercises?.length > 0);
                const isRest = index === 6 || !hasWorkout; // Sunday is always rest by default unless defined

                const label = isRest && index === 6 ? 'SUN(REST)' : d;

                const isActive = activeDay === fullDayName;

                return (
                    <button
                        key={d}
                        onClick={() => onChange(fullDayName)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            background: isActive ? '#1a1a1a' : 'transparent',
                            color: isActive ? '#FF5C1A' : '#666',
                            border: `1px solid ${isActive ? '#FF5C1A' : 'transparent'}`,
                            fontWeight: isActive ? '700' : '600',
                            fontSize: '12px',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        onMouseOver={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { if (!isActive) e.currentTarget.style.color = '#666'; }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
