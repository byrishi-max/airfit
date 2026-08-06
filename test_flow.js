const url = "https://airfitplangen.duckdns.org/webhook/airfit-gym-diet";

const payload = {
    clientId: "af_test_123",
    planType: "Workout Plan",
    name: "Test User",
    email: "test@example.com",
    phone: "1234567890",
    goal: "Build Muscle",
    activityLevel: "Complete Beginner",
    gymAccess: "Full Gym",
    daysPerWeek: "3 days",
    sessionLength: "45 min"
};

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
}).then(res => res.text()).then(text => {
    console.log("Submit Response:", text);
}).catch(err => {
    console.error("Submit Error:", err);
});

// Poll the status
let attempts = 0;
const poll = setInterval(() => {
    attempts++;
    fetch("https://airfitplangen.duckdns.org/webhook/airfit-get-plan?clientId=af_test_123")
        .then(res => res.json())
        .then(data => {
            console.log(`Poll ${attempts}:`, data.status);
            if (data.status === 'ready') {
                console.log("Plan is ready!");
                clearInterval(poll);
            }
        }).catch(err => console.error("Poll Error:", err));
    
    if (attempts >= 20) {
        console.log("Gave up polling.");
        clearInterval(poll);
    }
}, 5000);
