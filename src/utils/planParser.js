export const parseWorkoutJson = (jsonStrOrObj) => {
    if (!jsonStrOrObj) return null;
    if (typeof jsonStrOrObj === 'object') return jsonStrOrObj;

    try {
        return JSON.parse(jsonStrOrObj);
    } catch (e) {
        console.error("Error parsing workout plan JSON", e);
        return null;
    }
};

export const getDemoWorkoutPlan = () => {
    return {
        greeting: "Hi there! Here is a sample workout plan while we connect to the AI.",
        overview: "This 6-day plan focuses on building muscle and strength.",
        days: [
            {
                day: "Monday",
                muscle: "Chest & Triceps",
                exercises: [
                    {
                        name: "Barbell Bench Press",
                        sets: "4",
                        reps: "8-10",
                        videoId: "hWbUlkb5Ms4",
                        videoTitle: "How To Bench Press"
                    },
                    {
                        name: "Incline Dumbbell Press",
                        sets: "3",
                        reps: "10-12",
                        videoId: "8iPEnn-ltC8",
                        videoTitle: "How To Incline Dumbbell Press"
                    }
                ]
            },
            {
                day: "Tuesday",
                muscle: "Back & Biceps",
                exercises: [
                    {
                        name: "Pull-ups",
                        sets: "3",
                        reps: "AMRAP",
                        videoId: "eGo4IYPNBGc",
                        videoTitle: "How To Pull Up"
                    }
                ]
            }
        ],
        warmup: ["5 mins light cardio", "Dynamic stretching"],
        cooldown: ["Static stretching"],
        recoveryTips: ["Drink plenty of water", "Get 8 hours of sleep"]
    };
};
