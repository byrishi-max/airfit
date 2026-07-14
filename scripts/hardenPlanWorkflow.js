const fs = require('fs');

const workflowPaths = process.argv.slice(2);

if (!workflowPaths.length) {
  console.error('Usage: node scripts/hardenPlanWorkflow.js <workflow.json> [...]');
  process.exit(1);
}

const formatCuratedCode = `const items = $input.all();
const exItems = $('Extract Exercises').all();
const clientCtx = $('Build Gemini Prompt').first().json;
const out = [];

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pairedIndex(item, fallback) {
  const paired = item.pairedItem;
  if (Array.isArray(paired) && paired[0] && Number.isInteger(paired[0].item)) return paired[0].item;
  if (paired && Number.isInteger(paired.item)) return paired.item;
  return fallback;
}

function findExercise(cur, item, fallbackIndex) {
  const fields = cur.fields || {};
  const documentSlug = String(cur.name || '').split('/').pop();
  const curatedName = fields.name?.stringValue || '';
  const direct = exItems[pairedIndex(item, fallbackIndex)]?.json;
  if (direct && (slug(direct.curatedSlug || direct.exerciseName) === documentSlug || norm(direct.exerciseName) === norm(curatedName))) return direct;
  return exItems.find(ex => {
    const json = ex.json || {};
    return slug(json.curatedSlug || json.exerciseName) === documentSlug || norm(json.exerciseName) === norm(curatedName);
  })?.json || direct || {};
}

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const cur = item.json || {};
  const fields = cur.fields || {};
  const exCtx = findExercise(cur, item, i);
  const exactName = fields.name?.stringValue || exCtx.exerciseName || '';
  const videoId = fields.videoId?.stringValue || null;
  const videoUrl = fields.url?.stringValue || (videoId ? 'https://www.youtube.com/watch?v=' + videoId : null);
  const thumb = fields.thumb?.stringValue || null;

  out.push({ json: {
    exerciseMode: true,
    exerciseName: exactName,
    sets: exCtx.sets || '3',
    reps: exCtx.reps || '10',
    setsReps: exCtx.setsReps || '3 x 10',
    day: exCtx.day || '',
    muscle: exCtx.muscle || '',
    videoId,
    videoUrl,
    videoTitle: exactName,
    channelName: 'Airfit Curated',
    durationSeconds: Number(fields.durationSeconds?.integerValue || fields.durationSeconds?.doubleValue || 30),
    isShortCandidate: true,
    isPreferredShort: true,
    videoFallback: false,
    videoSearchQuery: '',
    thumb,
    workoutJson: exCtx.workoutJson || null,
    clientId: clientCtx.clientId,
    clientName: clientCtx.clientName,
    clientEmail: clientCtx.clientEmail,
    clientPhone: clientCtx.clientPhone,
    planType: clientCtx.planType,
    goal: clientCtx.goal,
    isDiet: false
  }});
}
return out;`;

const attachVideoCode = `const ytItems = $input.all();
const exItems = $('Extract Exercises').all();
const firstExtracted = exItems[0]?.json || {};

if (firstExtracted.exerciseMode === false) {
  return exItems.map(item => ({ json: item.json }));
}

const clientCtx = $('Build Gemini Prompt').first().json;
const output = [];

const SAFE_FALLBACKS = [
  ['incline dumbbell press', '8iPEnn-ltC8'],
  ['bench press', 'hWbUlkb5Ms4'],
  ['barbell bench press', 'hWbUlkb5Ms4'],
  ['cable fly', 'Iwe6AmxVf7o'],
  ['triceps pushdown', '2-LAMcpzODU'],
  ['triceps extension', 'YbX7Wd8jQ-Q'],
  ['lat pulldown', 'CAwf7n6Luuc'],
  ['seated cable row', 'GZbfZ033f74'],
  ['dumbbell row', 'pYcpY20QaE8'],
  ['t-bar row', 'j3Igk5nyZE4'],
  ['face pull', 'rep-qVOkqgk'],
  ['dumbbell curl', 'ykJmrZ5v0Oo'],
  ['incline dumbbell curl', 'soxrZlIl35U'],
  ['hammer curl', 'zC3nLlEvin4'],
  ['squat', 'bEv6CCg2BC8'],
  ['romanian deadlift', 'JCXUYuzwNrM'],
  ['leg press', 'IZxyjW7MPJQ'],
  ['standing calf raise', 'YMmgqO8Jo-k'],
  ['overhead press', 'qEwKCR5JCog'],
  ['lateral raise', '3VcKaXpzqRo'],
  ['plank', 'pSHjTRCQxIw'],
  ['push-up', 'IODxDxX7oi4'],
  ['push up', 'IODxDxX7oi4'],
  ['mountain climber', 'nmwgirgXLYM'],
  ['burpee', 'TU8QYVW0gDU'],
  ['dead bug', 'g_BYB0R-4Ws']
];

function parseIsoDuration(value) {
  const match = String(value || '').match(/^PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?$/);
  if (!match) return null;
  return (Number(match[1] || 0) * 3600) + (Number(match[2] || 0) * 60) + Number(match[3] || 0);
}

function words(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\\s]/g, ' ')
    .split(/\\s+/)
    .filter(word => word.length > 2 && !['with', 'the', 'and', 'for', 'how', 'shorts', 'exercise', 'proper', 'form', 'workout'].includes(word));
}

function pairedIndex(item, fallback) {
  const paired = item.pairedItem;
  if (Array.isArray(paired) && paired[0] && Number.isInteger(paired[0].item)) return paired[0].item;
  if (paired && Number.isInteger(paired.item)) return paired.item;
  return fallback;
}

function fallbackFor(exerciseName) {
  const name = String(exerciseName || '').toLowerCase();
  const match = SAFE_FALLBACKS.find(([pattern]) => name.includes(pattern));
  if (!match) return null;
  return {
    videoId: match[1],
    videoUrl: 'https://www.youtube.com/watch?v=' + match[1],
    videoTitle: exerciseName + ' technique video',
    channelName: 'Airfit fallback',
    durationSeconds: null,
    isShortCandidate: false,
    isPreferredShort: false,
    videoFallback: true,
    thumb: null
  };
}

function scoreVideo(video, exerciseName) {
  const title = String(video.snippet?.title || '').toLowerCase();
  const channel = String(video.snippet?.channelTitle || '').toLowerCase();
  const duration = parseIsoDuration(video.contentDetails?.duration) || 9999;
  const exWords = words(exerciseName);
  const titleHits = exWords.filter(word => title.includes(word)).length;
  const allWordsHit = exWords.length > 0 && titleHits === exWords.length;
  let score = 0;
  if (duration <= 30) score += 140;
  else if (duration <= 60) score += 95;
  else if (duration <= 120) score += 15;
  score += titleHits * 25;
  if (allWordsHit) score += 45;
  if (title.includes('short') || title.includes('#shorts')) score += 18;
  if (title.includes('proper') || title.includes('form') || title.includes('tutorial')) score += 16;
  if (title.includes('mistake') || title.includes('compilation') || title.includes('funny')) score -= 45;
  if (channel.includes('official') || channel.includes('fitness') || channel.includes('coach')) score += 6;
  score -= Math.max(0, duration - 30) / 4;
  return score;
}

for (let i = 0; i < ytItems.length; i++) {
  const item = ytItems[i];
  const ytResp = item.json || {};
  const exCtx = exItems[pairedIndex(item, i)]?.json || {};
  const videos = (ytResp.items || [])
    .filter(video => video.id && video.status?.embeddable !== false)
    .map(video => ({ ...video, durationSeconds: parseIsoDuration(video.contentDetails?.duration) }));
  const sorted = videos.sort((a, b) => scoreVideo(b, exCtx.exerciseName) - scoreVideo(a, exCtx.exerciseName));
  const chosen = sorted.find(video => video.durationSeconds && video.durationSeconds <= 30)
    || sorted.find(video => video.durationSeconds && video.durationSeconds <= 60)
    || sorted[0]
    || null;

  let video = fallbackFor(exCtx.exerciseName);
  if (chosen) {
    const thumbnails = chosen.snippet?.thumbnails || {};
    video = {
      videoId: chosen.id,
      videoUrl: 'https://www.youtube.com/watch?v=' + chosen.id,
      videoTitle: chosen.snippet?.title || exCtx.exerciseName + ' technique video',
      channelName: chosen.snippet?.channelTitle || null,
      durationSeconds: chosen.durationSeconds || null,
      isPreferredShort: Boolean(chosen.durationSeconds && chosen.durationSeconds <= 30),
      isShortCandidate: Boolean(chosen.durationSeconds && chosen.durationSeconds <= 60),
      videoFallback: !Boolean(chosen.durationSeconds && chosen.durationSeconds <= 60),
      thumb: (thumbnails.medium || thumbnails.high || thumbnails.default || {}).url || null
    };
  }

  output.push({ json: {
    exerciseMode: true,
    exerciseName: exCtx.exerciseName || '',
    sets: exCtx.sets || '3',
    reps: exCtx.reps || '10',
    setsReps: exCtx.setsReps || '3 x ' + (exCtx.reps || '10'),
    day: exCtx.day || '',
    muscle: exCtx.muscle || '',
    videoId: video?.videoId || null,
    videoUrl: video?.videoUrl || null,
    videoTitle: video?.videoTitle || (exCtx.exerciseName ? exCtx.exerciseName + ' technique video' : null),
    channelName: video?.channelName || null,
    durationSeconds: video?.durationSeconds || null,
    isShortCandidate: Boolean(video?.isShortCandidate),
    isPreferredShort: Boolean(video?.isPreferredShort),
    videoFallback: Boolean(video?.videoFallback || !video?.videoId),
    videoSearchQuery: exCtx.ytQuery || '',
    thumb: video?.thumb || null,
    workoutJson: exCtx.workoutJson || null,
    clientId: clientCtx.clientId,
    clientName: clientCtx.clientName,
    clientEmail: clientCtx.clientEmail,
    clientPhone: clientCtx.clientPhone,
    planType: clientCtx.planType,
    goal: clientCtx.goal,
    isDiet: false
  }});
}
return output;`;

function patchPrompt(code) {
  let next = code;
  next = next
    .replace('Create a concise DIET PLAN:\\n1. Daily calorie target and macros\\n', 'Create a concise DIET PLAN with exact quantities.\\n1. Daily calorie target and macros in grams/kcal\\n')
    .replace('2. 7-day meal plan table (Day|Breakfast|Lunch|Dinner|Snacks)\\n', '2. 7-day meal plan table (Day|Breakfast|Lunch|Snack|Dinner). Every meal must include quantities like grams, ml, cups, eggs, chapatis, scoops, or pieces\\n')
    .replace('3. Pre/post workout meals\\n4. Hydration\\n5. Top 5 foods to avoid\\n6. 3 supplements\\n', '3. Pre/post workout meals with quantities\\n4. Hydration target in ml/litres\\n5. Top 5 foods to avoid\\n6. 3 optional supplements with dosage ranges only if common and safe\\n');
  next = next.replace(
    "headers bg #ff6b00 white padding:10px, cells padding:10px border-bottom:1px solid #333. '\n" +
      "    + 'Start: <p>Hi ' + body.name + '!</p>';",
    "headers bg #ff6b00 white padding:10px, cells padding:10px border-bottom:1px solid #333. '\n" +
      "    + 'Use simple foods, structured meals, and never leave a meal without quantity. Start: <p>Hi ' + body.name + '!</p>';"
  );
  next = next.replace(
    'generationConfig: { temperature: 0.65, maxOutputTokens: 4096 }',
    'generationConfig: { temperature: 0.35, maxOutputTokens: 4096 }'
  );
  return next;
}

function patchDietFallback(code) {
  return code.replace(
    "    ['Oats with banana and whey', 'Rice or roti with chicken or paneer, dal, vegetables', 'Fruit with curd or sprouts', 'Lean protein with vegetables and light carbs'],\n" +
      "    ['Eggs or paneer bhurji with toast', 'Chapati, dal, curd, salad, lean protein', 'Peanut butter toast or nuts', 'Rice bowl with paneer/chicken and greens'],\n" +
      "    ['Poha or upma with curd', 'Rice, rajma/chole, salad, protein side', 'Banana and whey or lassi', 'Roti with vegetables and protein'],\n" +
      "    ['Smoothie with whey, oats, fruit', 'Chicken/paneer wrap with salad', 'Sprouts chaat', 'Dal, rice, vegetables, curd'],\n" +
      "    ['Idli/dosa with sambar and eggs/paneer', 'Roti, sabzi, dal, lean protein', 'Fruit and nuts', 'Grilled protein with soup/salad'],\n" +
      "    ['Paratha with curd and protein side', 'Rice/roti, dal, vegetables, paneer/chicken', 'Greek yogurt or chana', 'Light home meal with protein'],\n" +
      "    ['Balanced brunch with eggs/paneer', 'Home meal with rice/roti, dal, vegetables', 'Fruit and curd', 'Light protein-rich dinner']",
    "    ['60g oats + 1 banana + 1 scoop whey or 200ml milk', '180g cooked rice or 3 rotis + 150g chicken/paneer + 1 cup dal + 1 cup vegetables', '1 fruit + 200g curd or 1 cup sprouts', '150g lean protein + 2 cups vegetables + 150g cooked rice or 2 rotis'],\n" +
      "    ['3 eggs or 120g paneer bhurji + 2 toast + 1 fruit', '3 chapatis + 1 cup dal + 150g curd + salad + 120g protein', '1 toast + 1 tbsp peanut butter + 10 almonds', '180g rice + 150g paneer/chicken + 2 cups greens'],\n" +
      "    ['1.5 cups poha/upma + 150g curd', '180g rice + 1 cup rajma/chole + salad + 120g protein side', '1 banana + 1 scoop whey or 250ml lassi', '3 rotis + 1.5 cups vegetables + 120g protein'],\n" +
      "    ['Smoothie: 1 scoop whey + 40g oats + 1 fruit + 250ml milk', '1 wrap with 150g chicken/paneer + salad', '1 cup sprouts chaat', '1 cup dal + 150g rice + 1 cup vegetables + 150g curd'],\n" +
      "    ['3 idli or 2 dosa + 1 cup sambar + 2 eggs/100g paneer', '3 rotis + 1 cup sabzi + 1 cup dal + 120g protein', '1 fruit + 15g nuts', '150g grilled protein + soup/salad + 1 small potato or 2 rotis'],\n" +
      "    ['2 parathas + 150g curd + 2 eggs/100g paneer', '180g rice or 3 rotis + 1 cup dal + 1 cup vegetables + 150g paneer/chicken', '200g Greek yogurt or 1 cup chana', 'Light meal: 120g protein + 2 rotis + salad'],\n" +
      "    ['Brunch: 3 eggs/150g paneer + 2 toast + fruit', 'Home meal: 180g rice or 3 rotis + 1 cup dal + 1 cup vegetables', '1 fruit + 150g curd', 'Light dinner: 120g protein + 1 cup vegetables']"
  );
}

function nodeByName(workflow, name) {
  const node = workflow.nodes.find(item => item.name === name);
  if (!node) throw new Error(`Missing node: ${name}`);
  return node;
}

for (const workflowPath of workflowPaths) {
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  nodeByName(workflow, 'Format Curated Video').parameters.jsCode = formatCuratedCode;
  nodeByName(workflow, 'Attach Exercise Video').parameters.jsCode = attachVideoCode;
  const promptNode = nodeByName(workflow, 'Build Gemini Prompt');
  promptNode.parameters.jsCode = patchPrompt(promptNode.parameters.jsCode);
  const routeNode = nodeByName(workflow, 'Route Plan Type');
  routeNode.parameters.jsCode = patchDietFallback(routeNode.parameters.jsCode);
  fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
  console.log(`Hardened ${workflowPath}`);
}
