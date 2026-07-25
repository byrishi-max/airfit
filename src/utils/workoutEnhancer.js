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

const FIXED_CARDIO = {
    name: 'Treadmill',
    videoId: '5bBiW1qKVLc',
    sets: '1',
    reps: '10-15 mins',
    phase: 'warmup'
};

const COOLDOWN_OPTIONS = [
    // Light Cardio
    { name: 'Slow Walking', videoId: '0jxuHIUwolk' },
    { name: 'Easy Spot Jog', videoId: 'f8PzF8bhYoo' },
    { name: 'Stationary Cycling (Slow)', videoId: 'dieOsJlsvpM' },
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
    // Bodyweight
    { name: 'Crunches', videoId: 'NnVhqMQRvmM' },
    { name: 'Sit-Ups', videoId: 'onaQ0v_J5uU' },
    { name: 'Reverse Crunches', videoId: 'XY8KzdDcMFg' },
    { name: 'Leg Raises', videoId: 'JB2oyawG9KI' },
    { name: 'Hanging Leg Raises', videoId: 'Yrtvs-nEnk0' },
    { name: 'Flutter Kicks', videoId: 'ZB1SwBRVLCc' },
    { name: 'Scissor Kicks', videoId: 'CcvAr4JYo0U' },
    { name: 'Mountain Climbers', videoId: 'kLh-uczlPLg' },
    // Oblique
    { name: 'Russian Twists', videoId: 'Tau0hsW8iR0' },
    { name: 'Bicycle Crunches', videoId: 'wnuLak2onoA' },
    { name: 'Side Crunches', videoId: 'q0QyCrpiNgI' },
    { name: 'Heel Touches', videoId: 'RQRKLIpwIJs' },
    { name: 'Side Plank Dips', videoId: '9dNL_mtObGQ' },
    // Core Stability
    { name: 'Plank', videoId: 'pvIjsG5Svck' },
    { name: 'Side Plank', videoId: 'N_s9em1xTqU' },
    { name: 'Plank Shoulder Taps', videoId: '8rgurWd-PB8' },
    { name: 'Hollow Body Hold', videoId: 'EsnM8eBtazU' },
    { name: 'Dead Bug', videoId: 'jbWmbhElf3Q' },
    { name: 'Bird Dog', videoId: 'vzU5xrs1gMQ' },
    // Machine / Cable
    { name: 'Cable Crunch', videoId: 'ByZJuk85YuE' },
    { name: 'Cable Woodchopper (High to Low)', videoId: 'gcGNypjIQDo' },
    { name: 'Reverse Cable Woodchopper (Low to High)', videoId: 'mvvu8imyMFs' },
    { name: 'Pallof Press', videoId: 'HXrLaqNIkTs' },
    // Weighted Abs
    { name: 'Weighted Crunch', videoId: 'cbwLMF7oJGI' },
    { name: 'Decline Sit-Ups', videoId: 'N7hf1_vcX5w' },
    { name: 'Medicine Ball Slams', videoId: 'CkO1mfSBvv4' },
    { name: 'Medicine Ball Russian Twists', videoId: '2_MsoqTpIJ8' },
    // Advanced
    { name: 'Ab Wheel Rollouts', videoId: 'zCsW9L2qi-0' },
    { name: 'Hanging Windshield Wipers', videoId: 'q-5xzuVDZ0o' },
    { name: 'L-Sit Hold', videoId: '11B3alBjq-U' },
    { name: 'V-Ups', videoId: 'NxkukiEoh3g' }
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
        const warmupExercises = [BEFORE_WORKOUT_VIDEO];

        // 2. Validate and Tag Main Exercises (Min 4)
        let mainExercises = (dayObj.exercises || []).map(ex => ({
            ...ex,
            phase: 'main'
        }));
        
        // Ensure at least 4 main exercises exist
        if (mainExercises.length > 0 && mainExercises.length < 4) {
            const needed = 4 - mainExercises.length;
            for (let i = 0; i < needed; i++) {
                mainExercises.push({
                    name: 'Additional Exercise (Please Edit)',
                    sets: '3',
                    reps: '10-12',
                    phase: 'main'
                });
            }
        }

        // 3. Prepare Cardio (Fixed Treadmill)
        const cardioExercises = [{ ...FIXED_CARDIO }];

        // 4. Prepare Core (if applicable)
        let coreExercises = [];
        if (isCoreDay) {
            coreExercises = getRandomItems(AB_OPTIONS, 3).map(ab => ({
                name: ab.name,
                videoId: ab.videoId,
                sets: '3',
                reps: '15-20',
                phase: 'core'
            }));
        }

        // 5. Prepare Cool-Down (Exactly 1 random)
        const cooldownItem = getRandomItems(COOLDOWN_OPTIONS, 1)[0];
        const cooldownExercises = [
            {
                name: `Cool-Down: ${cooldownItem.name}`,
                videoId: cooldownItem.videoId,
                sets: '1',
                reps: 'Follow along',
                phase: 'cooldown'
            }
        ];

        // Combine all phases in exact order requested
        return {
            ...dayObj,
            exercises: [
                ...warmupExercises,
                ...mainExercises,
                ...cardioExercises,
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
