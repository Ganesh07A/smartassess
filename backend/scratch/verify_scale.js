const testCode = "print('Hello from Pro-Scale Runner!')";
const baseUrl = "https://ce.judge0.com";

async function test() {
  console.log("Testing Resilient Key-less Runner...");
  try {
    const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: testCode,
        language_id: 71, // Python
      }),
    });
    
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Stdout:", data.stdout);
    if (data.stdout && data.stdout.trim() === 'Hello from Pro-Scale Runner!') {
      console.log("✅ SUCCESS: Code executed perfectly without a key!");
    } else {
      console.log("❌ FAILED: Unexpected output.");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

test();
