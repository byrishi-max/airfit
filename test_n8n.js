const url = "https://airfitplangen.duckdns.org/webhook/airfit-gym-diet";
const start = Date.now();
fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: "data" })
}).then(res => res.text()).then(text => {
    console.log("Success! Time:", Date.now() - start, "ms. Status:", text);
}).catch(err => {
    console.error("Failed! Time:", Date.now() - start, "ms. Error:", err);
});
