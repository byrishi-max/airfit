import React, { useEffect, useState } from 'react';
import { Flame, Loader2, Plus } from 'lucide-react';
import { getCaloriesForDate, logCalories } from '../utils/progressRepository';

export default function CalorieTracker({ clientId }) {
    const [food, setFood] = useState('');
    const [calories, setCalories] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function loadLogs() {
            if (!clientId) return;
            setLoading(true);
            setError('');
            try {
                const nextLogs = await getCaloriesForDate(clientId);
                if (!cancelled) setLogs(nextLogs);
            } catch {
                if (!cancelled) setError('Could not load calorie logs.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadLogs();
        return () => {
            cancelled = true;
        };
    }, [clientId]);

    const handleAdd = async (event) => {
        event.preventDefault();
        if (!food.trim() || !calories || saving) return;

        setSaving(true);
        setError('');
        try {
            const nextLogs = await logCalories(clientId, food.trim(), parseInt(calories, 10));
            setLogs(nextLogs);
            setFood('');
            setCalories('');
        } catch {
            setError('Could not save calorie log. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const totalCalories = logs.reduce((sum, log) => sum + Number(log.calories || 0), 0);

    return (
        <div className="fit-calorie-panel">
            <div className="fit-section-header fit-section-header-compact">
                <div>
                    <p className="fit-kicker">Nutrition</p>
                    <h2>Daily calorie tracker</h2>
                    <span className="fit-repeat-inline">Saved intake syncs with dashboard analytics.</span>
                </div>
                <span className="fit-calorie-total"><Flame size={16} /> {totalCalories} kcal</span>
            </div>

            <form className="fit-calorie-form" onSubmit={handleAdd}>
                <input
                    type="text"
                    placeholder="Food name"
                    value={food}
                    onChange={(event) => setFood(event.target.value)}
                    disabled={saving}
                />
                <input
                    type="number"
                    placeholder="kcal"
                    value={calories}
                    onChange={(event) => setCalories(event.target.value)}
                    disabled={saving}
                />
                <button type="submit" disabled={saving || !food.trim() || !calories}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add
                </button>
            </form>

            {error && <div className="fit-submit-error">{error}</div>}

            <div className="fit-log-list">
                {loading ? (
                    <div className="fit-skeleton-list">
                        <span />
                        <span />
                        <span />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="fit-empty-copy">No calories logged yet today.</p>
                ) : (
                    logs.map((log, index) => (
                        <div key={`${log.food}-${log.createdAt || index}`} className="fit-log-row">
                            <div>
                                <strong>{log.food}</strong>
                                <small>{log.time || 'Today'}</small>
                            </div>
                            <b>{log.calories} kcal</b>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
