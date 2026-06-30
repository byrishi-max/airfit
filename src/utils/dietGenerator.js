export function generateDietPlanHtml(form) {
    const { name, goal, dietPreference, mealsPerDay, allergies, weight, height, age, gender } = form;

    // Determine constraints
    const isVegan = dietPreference?.toLowerCase().includes('vegan');
    const isVeg = dietPreference?.toLowerCase().includes('vegetarian');
    const isEggetarian = dietPreference?.toLowerCase().includes('eggetarian');
    const allergyLower = (allergies || '').toLowerCase();
    
    const isDiabetic = allergyLower.includes('diabet');
    const isKeto = allergyLower.includes('keto');
    const isLactoseFree = allergyLower.includes('lactose') || allergyLower.includes('dairy');

    // Safe BMR calculation
    const w = Number(weight) || 70;
    const h = Number(height) || 170;
    const a = Number(age) || 25;
    const isMale = String(gender).toLowerCase() === 'male';
    
    // Mifflin-St Jeor
    let bmr = (10 * w) + (6.25 * h) - (5 * a) + (isMale ? 5 : -161);
    let tdee = bmr * 1.375; // Lightly active base
    
    let targetCalories = tdee;
    if (goal === 'Fat Loss') targetCalories -= 400;
    else if (goal === 'Muscle Gain') targetCalories += 300;
    
    targetCalories = Math.round(targetCalories / 100) * 100;
    const proteinTarget = Math.round(w * (goal === 'Muscle Gain' ? 2 : 1.6));
    const fatTarget = Math.round((targetCalories * 0.25) / 9);
    const carbTarget = Math.round((targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4);

    // Filter Meal Elements
    let mealTypes = 'Balanced Meals';
    if (isDiabetic) mealTypes = 'Low Sugar / Low GI Meals';
    if (isKeto) mealTypes = 'Ketogenic Meals (Ultra Low Carb)';
    if (isVegan) mealTypes = 'Vegan Meals';

    const getProteins = () => {
        if (isVegan) return 'Tofu, Tempeh, Lentils, Chickpeas, Vegan Protein Powder';
        if (isVeg) return 'Paneer, Lentils, Greek Yogurt, Whey Protein';
        if (isEggetarian) return 'Eggs, Egg Whites, Paneer, Lentils, Whey Protein';
        return 'Chicken Breast, Fish, Eggs, Lean Beef, Whey Protein';
    };

    const getCarbs = () => {
        if (isKeto) return 'Cruciferous veggies, leafy greens (Trace carbs only)';
        if (isDiabetic) return 'Quinoa, Oats, Sweet Potato, Brown Rice (Low GI)';
        return 'White/Brown Rice, Oats, Potatoes, Fruits, Whole Wheat Roti';
    };

    const getFats = () => {
        if (isLactoseFree || isVegan) return 'Olive oil, Almonds, Walnuts, Avocado, Peanut Butter';
        return 'Olive oil, Almonds, Ghee, Avocado, Peanut Butter';
    };

    const numMeals = Number(mealsPerDay) || 4;
    let mealsHtml = '';

    for (let i = 1; i <= numMeals; i++) {
        let mealName = `Meal ${i}`;
        if (numMeals === 3) mealName = i === 1 ? 'Breakfast' : i === 2 ? 'Lunch' : 'Dinner';
        if (numMeals === 4) mealName = i === 1 ? 'Breakfast' : i === 2 ? 'Lunch' : i === 3 ? 'Snack' : 'Dinner';

        let portion = Math.round(targetCalories / numMeals);
        
        mealsHtml += `
            <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#FF6B00; margin-top:0; margin-bottom: 8px; font-size: 16px;">${mealName} <span style="font-size:12px; color:#777; font-weight:normal;">(~${portion} kcal)</span></h4>
                <p style="margin: 0; color: #d0d0d0; font-size: 14px; line-height: 1.5;">
                    <strong>Protein:</strong> 1 portion of ${getProteins().split(', ')[i % 4] || 'Protein source'}<br/>
                    <strong>Carbs:</strong> 1 portion of ${getCarbs().split(', ')[i % 3] || 'Carb source'}<br/>
                    <strong>Fats/Veggies:</strong> Add ${getFats().split(', ')[i % 3] || 'Healthy fats'} + mixed greens.
                </p>
            </div>
        `;
    }

    return `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px;">
            <p style="font-size: 18px; color: #fff;">Hi ${name || 'there'}!</p>
            <h2 style="color:#FF6B00; font-size: 24px; margin-bottom: 24px;">Personalised Diet Plan - ${goal || 'General Fitness'}</h2>
            
            <div style="background: rgba(255,107,0,0.1); padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #FF6B00;">
                <h3 style="color:#FF6B00; margin-top:0; font-size: 18px;">1. Daily Calorie Target and Macros</h3>
                <p style="color:#e0e0e0; font-size: 14px; margin-bottom: 16px;">
                    This plan is strictly customized for <strong>${mealTypes}</strong> based on your preferences.
                </p>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <div style="background: #111; padding: 12px; border-radius: 6px; flex: 1; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="color:#777; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Calories</div>
                        <div style="color:#fff; font-size: 20px; font-weight: bold;">${targetCalories}</div>
                    </div>
                    <div style="background: #111; padding: 12px; border-radius: 6px; flex: 1; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="color:#777; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Protein</div>
                        <div style="color:#fff; font-size: 20px; font-weight: bold;">${proteinTarget}g</div>
                    </div>
                    <div style="background: #111; padding: 12px; border-radius: 6px; flex: 1; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="color:#777; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Carbs</div>
                        <div style="color:#fff; font-size: 20px; font-weight: bold;">${carbTarget}g</div>
                    </div>
                    <div style="background: #111; padding: 12px; border-radius: 6px; flex: 1; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="color:#777; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Fats</div>
                        <div style="color:#fff; font-size: 20px; font-weight: bold;">${fatTarget}g</div>
                    </div>
                </div>
            </div>

            <h3 style="color:#FF6B00; font-size: 18px; margin-bottom: 16px;">2. Your ${numMeals}-Meal Daily Template</h3>
            ${mealsHtml}
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #888; font-size: 12px; line-height: 1.5;">
                    <strong>Instructions:</strong> Drink 3-4 liters of water daily. If your goal is fat loss and progress stalls, reduce carbs slightly. For muscle gain, ensure you are hitting the protein target daily.
                </p>
            </div>
        </div>
    `;
}
