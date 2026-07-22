/**
 * Utility to inject Warmup, Core, and Cool-down phases into the AI-generated workout plans.
 */

const BEFORE_WORKOUT_VIDEO = {
    name: 'Before Workout (Required)',
    videoId: 'KFcnspwkyLA',
    sets: '1',
    reps: 'Watch',
    phase: 'warmup',
};

const AFTER_WORKOUT_VIDEO = {
    name: 'After Workout (Required)',
    videoId: 'r5QG2Lq1oUo',
    sets: '1',
    reps: 'Watch',
    phase: 'cooldown',
};

const CARDIO_OPTIONS = [
    { name: 'Treadmill', videoId: '5bBiW1qKVLc' },
    { name: 'Cross Trainer', videoId: 'vAiUh0P_XmY' },
    { name: 'Lateral Cross Trainer', videoId: 'Q8KoScI2o20' },
    { name: 'Stationary Cycling', videoId: 'dieOsJlsvpM' },
];

const STRETCHING_OPTIONS = [
    // Light Cardio
    { name: 'Slow Walking', videoId: '0jxuHIUwolk' },
    { name: 'Easy Spot Jog', videoId: 'f8PzF8bhYoo' },
    // Upper Body
    { name: 'Neck Stretch (Forward / Side)', videoId: '6Tr3GLfySYo' },
    { name: 'Shoulder Stretch (Cross-Body)', videoId: 'aIq0fLi8iak' },
    { name: 'Overhead Triceps Stretch', videoId: 'zzvDO56B0HE' },
    { name: 'Chest Opener Stretch', videoId: 'crnw1IKWNZY' },
    { name: 'Upper Back Stretch', videoId: 'BtUTVjozCEk' },
    // Arm & Forearm
    { name: 'Biceps Stretch', videoId: 'VIOYPKNQ13Y' },
    { name: 'Triceps Stretch', videoId: 'zzvDO56B0HE' },
    { name: 'Wrist Flexor Stretch', videoId: 'R7dI2ZcbiMI' },
    { name: 'Wrist Extensor Stretch', videoId: 'i-JV2PsFzWA' },
    // Back & Core
    { name: 'Cat Stretch', videoId: 'Y-s5X4yKPCs' },
    { name: 'Child’s Pose', videoId: '_ZX_zTOBgp8' },
    { name: 'Seated Forward Bend', videoId: 'SLIaql7h6RQ' },
    { name: 'Cobra Stretch', videoId: 'JDcdhTuycOI' },
    { name: 'Supine Spinal Twist', videoId: 'TeAhhVD2q1c' },
    // Lower Body
    { name: 'Standing Quad Stretch', videoId: 'ob1tvmQUQZ0' },
    { name: 'Hamstring Stretch', videoId: 'HFPbNaMzW3M' },
    { name: 'Calf Stretch', videoId: 'TCnziUWGTf4' },
    { name: 'Glute Stretch', videoId: 'NURGHgR7PDw' },
    { name: 'Hip Flexor Stretch', videoId: 'ZQXGUfGmgKc' },
    // Floor-Based Relaxation
    { name: 'Butterfly Stretch', videoId: '4J7kbCmPScQ' },
    { name: 'Happy Baby Pose', videoId: 'DsuQQMzFU-4' },
    { name: 'Legs-Up-The-Wall Pose', videoId: 'h2UrHSo9Pdk' },
    // Breathing
    { name: 'Diaphragmatic Breathing', videoId: 'qhcBjSirMss' },
    { name: 'Box Breathing', videoId: 'c753Zw9Wloc' },
    { name: 'Supine Relaxation (Shavasana)', videoId: '9ZsTLblha9o' },
];

const AB_OPTIONS = [
    { name: 'Crunches' },
    { name: 'Plank' },
    { name: 'Leg Raises' },
    { name: 'Bicycle Crunches' },
    { name: 'Russian Twists' },
    { name: 'Mountain Climbers' },
    { name: 'Hollow Body Hold' },
    { name: 'V-Ups' },
    { name: 'Dead Bug' }
];

function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Enriches the raw workout plan by adding mandatory warmups, cool-downs, and core exercises.
 */
export function enhanceWorkoutPlan(rawPlan) {
    if (!rawPlan || !rawPlan.days) return rawPlan;

    // Deep clone to avoid mutating original state
    const enhancedDays = JSON.parse(JSON.stringify(rawPlan.days)).map((dayObj) => {
        // Leave Rest days completely alone
        if (!dayObj.exercises || dayObj.exercises.length === 0 || dayObj.muscle?.toLowerCase() === 'rest') {
            return dayObj;
        }

        const isCoreDay = ['Monday', 'Wednesday', 'Friday'].includes(dayObj.day);

        // 1. Prepare Warmup
        const cardio = getRandomItems(CARDIO_OPTIONS, 1)[0];
        const warmupExercises = [
            BEFORE_WORKOUT_VIDEO,
            {
                name: `Cardio: ${cardio.name}`,
                videoId: cardio.videoId,
                sets: '1',
                reps: '10-15 mins',
                phase: 'warmup'
            }
        ];

        // 2. Tag Main Exercises
        const mainExercises = (dayObj.exercises || []).map(ex => ({
            ...ex,
            phase: 'main'
        }));

        // 3. Prepare Core (if applicable)
        let coreExercises = [];
        if (isCoreDay) {
            coreExercises = getRandomItems(AB_OPTIONS, 3).map(ab => ({
                name: ab.name,
                sets: '3',
                reps: '15-20',
                phase: 'core'
            }));
        }

        // 4. Prepare Cool-Down
        const stretches = getRandomItems(STRETCHING_OPTIONS, 3).map(stretch => ({
            name: `Stretch: ${stretch.name}`,
            videoId: stretch.videoId,
            sets: '1',
            reps: '30-45 secs',
            phase: 'cooldown'
        }));

        const cooldownExercises = [
            ...stretches,
            AFTER_WORKOUT_VIDEO
        ];

        // Combine all phases
        return {
            ...dayObj,
            exercises: [
                ...warmupExercises,
                ...mainExercises,
                ...coreExercises,
                ...cooldownExercises
            ]
        };
    });

    return {
        ...rawPlan,
        days: enhancedDays
    };
}
