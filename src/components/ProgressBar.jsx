import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ProgressBar({ completedCount, totalCount, percent }) {
    if (totalCount === 0) return null;

    const isComplete = percent === 100;

    return (
        <div className="fit-progress-module">
            <div className="fit-progress-module-head">
                <div>
                    <strong>Day progress</strong>
                    <span>{completedCount} of {totalCount} exercises completed</span>
                </div>
                <b className={isComplete ? 'is-complete' : ''}>{percent}%</b>
            </div>
            <div className="fit-progress-track">
                <div className={isComplete ? 'is-complete' : ''} style={{ width: `${percent}%` }} />
            </div>
            {isComplete && (
                <div className="fit-complete-note">
                    <CheckCircle2 size={15} />
                    Daily goal reached
                </div>
            )}
        </div>
    );
}
