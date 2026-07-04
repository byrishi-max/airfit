import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wfPath = path.resolve(__dirname, '../wf_maiz82IchPuO1an9.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const checkDbNode = {
  "parameters": {
    "method": "GET",
    "url": "https://firestore.googleapis.com/v1/projects/airfit-db/databases/(default)/documents/curated_videos/={{ $json.exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }}",
    "sendQuery": false,
    "options": {
      "response": {
        "response": {
          "neverError": true
        }
      }
    }
  },
  "id": "node-check-db",
  "name": "Check Curated DB",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1100, 160]
};

const switchNode = {
  "parameters": {
    "dataType": "string",
    "value1": "={{ $json.error ? 'not_found' : 'found' }}",
    "rules": {
      "rules": [
        {
          "value2": "found",
          "output": 0
        },
        {
          "value2": "not_found",
          "output": 1
        }
      ]
    },
    "fallbackOutput": 1
  },
  "id": "node-switch-db",
  "name": "Switch (Found in DB?)",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "position": [1250, 160]
};

const formatCuratedNode = {
  "parameters": {
    "jsCode": "const items = $input.all();\nconst exItems = $('Extract Exercises').all();\nconst clientCtx = $('Build Gemini Prompt').first().json;\nconst out = [];\n\nfor (let i = 0; i < items.length; i++) {\n  const cur = items[i].json;\n  // Fallback to finding the matching exercise by item index, or just assuming 1:1 if handled individually.\n  // Since HTTP node processes items sequentially, we can map them directly:\n  const exCtx = exItems[i].json;\n  \n  const fields = cur.fields || {};\n  const videoId = fields.videoId?.stringValue || null;\n  const videoUrl = fields.url?.stringValue || null;\n  const thumb = fields.thumb?.stringValue || null;\n\n  out.push({ json: {\n    exerciseMode: true,\n    exerciseName: exCtx.exerciseName || '',\n    sets: exCtx.sets || '3',\n    reps: exCtx.reps || '10',\n    setsReps: exCtx.setsReps || '3 x 10',\n    day: exCtx.day || '',\n    muscle: exCtx.muscle || '',\n    videoId,\n    videoUrl,\n    videoTitle: fields.name?.stringValue || exCtx.exerciseName,\n    channelName: 'Airfit Curated',\n    durationSeconds: 30,\n    isShortCandidate: true,\n    isPreferredShort: true,\n    videoFallback: false,\n    videoSearchQuery: '',\n    thumb,\n    workoutJson: exCtx.workoutJson || null,\n    clientId: clientCtx.clientId,\n    clientName: clientCtx.clientName,\n    clientEmail: clientCtx.clientEmail,\n    clientPhone: clientCtx.clientPhone,\n    planType: clientCtx.planType,\n    goal: clientCtx.goal,\n    isDiet: false\n  }});\n}\nreturn out;"
  },
  "id": "node-format-curated",
  "name": "Format Curated Video",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1440, 0]
};

const mergeNode = {
  "parameters": {
    "mode": "append"
  },
  "id": "node-merge-videos",
  "name": "Merge Videos",
  "type": "n8n-nodes-base.merge",
  "typeVersion": 2,
  "position": [1800, 160]
};

// Adjust positions of existing nodes to make room
const ytSearch = wf.nodes.find(n => n.name === 'Search Exercise Video');
const ytValidate = wf.nodes.find(n => n.name === 'Validate Exercise Videos');
const ytAttach = wf.nodes.find(n => n.name === 'Attach Exercise Video');
if (ytSearch) ytSearch.position = [1440, 320];
if (ytValidate) ytValidate.position = [1600, 320];
if (ytAttach) ytAttach.position = [1600, 500]; // Wait, attach should run after validate, let's just push them right and down

// Add nodes
wf.nodes.push(checkDbNode, switchNode, formatCuratedNode, mergeNode);

// Update connections
wf.connections['Extract Exercises'].main[0] = [{ node: "Check Curated DB", type: "main", index: 0 }];
wf.connections['Check Curated DB'] = { main: [[{ node: "Switch (Found in DB?)", type: "main", index: 0 }]] };

wf.connections['Switch (Found in DB?)'] = {
  main: [
    [{ node: "Format Curated Video", type: "main", index: 0 }], // 0: Found
    [{ node: "Search Exercise Video", type: "main", index: 0 }] // 1: Not Found
  ]
};

wf.connections['Format Curated Video'] = { main: [[{ node: "Merge Videos", type: "main", index: 0 }]] };
wf.connections['Attach Exercise Video'].main[0] = [{ node: "Merge Videos", type: "main", index: 1 }];

wf.connections['Merge Videos'] = { main: [[{ node: "Rebuild Workout Plan", type: "main", index: 0 }]] };

// Clean up old connection from Attach to Rebuild
// It used to be Attach Exercise Video -> Rebuild Workout Plan.

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('Successfully updated workflow JSON with mixed methodology!');
