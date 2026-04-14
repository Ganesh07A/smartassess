/**
 * Usage:
 *   node scripts/fetch_stitch_project_assets.js --api-base "https://<stitch-api-base>" --project-id "7266887951123028592" --out-dir "./stitch-mobile-pwa-upgrade" --token "<YOUR_TOKEN>"
 * 
 * Or set STITCH_TOKEN environment variable.
 */

const fs = require('fs/promises');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  let API_BASE = '';
  let PROJECT_ID = '7266887951123028592';
  let OUT_DIR = './stitch-mobile-pwa-upgrade';
  let TOKEN = process.env.STITCH_TOKEN || '';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--api-base':
        API_BASE = args[++i];
        break;
      case '--project-id':
        PROJECT_ID = args[++i];
        break;
      case '--out-dir':
        OUT_DIR = args[++i];
        break;
      case '--token':
        TOKEN = args[++i];
        break;
    }
  }

  if (!API_BASE) {
    console.error("Missing --api-base (example: https://api.stitch.example/v1)");
    process.exit(1);
  }

  if (!TOKEN) {
    console.error("Missing Stitch token. Set STITCH_TOKEN env var or pass --token.");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const SCREENS = [
    "design-system|asset-stub-assets-fa55a3535b684993876d280eb6106c8a-1776001023060",
    "exam-leaderboard-pwa|004fc199032d426096b4c56e89b0cb50",
    "teacher-results-overview-pwa|071ed8625fa94a31af4c5b4c1867557d",
    "submission-detail-modal-pwa|1e41b43c09514530813cc486b8f23cf2",
    "feedback-states-skeletons|6c918149bf614a49a7d4a6ced0e3b4dc",
    "submission-detail-modal|7818b530be54453985c00603808efc4d",
    "teacher-results-overview|acebe95971184ba8b49a07a832db47be",
    "exam-leaderboard-analytics|e6af0560ee444916a216fbcaea628442",
    "feedback-states-pwa|f2259108a70048f8af80a92610ad14aa"
  ];

  console.log(`Fetching project ${PROJECT_ID} into ${OUT_DIR}`);

  for (const item of SCREENS) {
    const [name, screenId] = item.split('|');
    const metaFile = path.join(OUT_DIR, `${name}.json`);

    console.log(`→ ${name} (${screenId})`);

    try {
      const response = await fetch(`${API_BASE}/projects/${PROJECT_ID}/screens/${screenId}`, {
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch metadata for ${name}: ${response.statusText}`);
        continue;
      }

      const meta = await response.json();
      await fs.writeFile(metaFile, JSON.stringify(meta, null, 2));

      // Replicating the logic from the bash script.
      const imageUrl = meta.imageUrl || meta.hostedImageUrl || meta.artifacts?.image?.url || meta.artifacts?.images?.[0]?.url;
      const codeUrl = meta.codeUrl || meta.hostedCodeUrl || meta.artifacts?.code?.url || meta.artifacts?.files?.[0]?.url;

      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        await fs.writeFile(path.join(OUT_DIR, `${name}.png`), Buffer.from(imgBuffer));
        console.log(`  image: ${OUT_DIR}/${name}.png`);
      } else {
        console.log(`  image: not found in metadata`);
      }

      if (codeUrl) {
        const codeRes = await fetch(codeUrl);
        const codeText = await codeRes.text();
        await fs.writeFile(path.join(OUT_DIR, `${name}.tsx`), codeText);
        console.log(`  code:  ${OUT_DIR}/${name}.tsx`);
      } else {
        console.log(`  code:  not found in metadata`);
      }
    } catch (err) {
      console.error(`Error processing ${name}: ${err.message}`);
    }
  }

  console.log("Done.");
}

main();
