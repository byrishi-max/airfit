const url = 'https://airfitplangen.duckdns.org/mcp-server/http';
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZjk4NTk4Ny00YWE2LTRmMTYtOTA1Ny02NDM3M2RkNzY1YjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6Ijg2M2FlODc2LTExYjUtNDJkOS1hOWZkLWFjYjNjOWI5NzM3YSIsImlhdCI6MTc3ODM1MzYwMH0.imQC8uHpMLXMzcPz4lIZEK4jAhL1somTU0xCIF9R4wI',
  'Accept': 'text/event-stream'
};

async function run() {
  const res = await fetch(url, { headers });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let endpoint = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    let isEndpointEvent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('event: endpoint')) {
        isEndpointEvent = true;
      } else if (isEndpointEvent && line.startsWith('data: ')) {
        endpoint = line.substring(6).trim();
        break;
      }
    }
    
    if (endpoint) break;
  }

  if (endpoint) {
    const postUrl = new URL(endpoint, url).toString();
    console.log('Session endpoint:', postUrl);
    
    // 1. List tools
    const toolsRes = await fetch(postUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    });
    
    const toolsData = await toolsRes.json();
    console.log('Tools:', JSON.stringify(toolsData, null, 2));
    
    // Find the execution getter tool
    const tools = toolsData?.result?.tools || [];
    const getExecTool = tools.find(t => t.name.includes('execution') || t.name.includes('n8n'));
    
    if (getExecTool) {
      console.log('Calling tool:', getExecTool.name);
      
      const execReq = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: getExecTool.name,
          arguments: {
            executionId: 4541
          }
        }
      };
      
      // Usually need to pass the ID based on the tool schema.
      // Let's just output the schema if we don't know it, but we can try to guess.
      // E.g. { "id": "4541" }
      execReq.params.arguments = { id: 4541, executionId: 4541, execution_id: 4541 };
      
      const callRes = await fetch(postUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(execReq)
      });
      console.log('Tool call result:', await callRes.text());
    } else {
        // If we don't know the tool name, just exit so we can read the tools list.
    }
  } else {
      console.log("No endpoint received.");
  }
  
  process.exit(0);
}
run();
