import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

async function main() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);

  console.log("=== ALL DOCUMENTS IN storeSettings ===");
  const snap = await getDocs(collection(db, 'storeSettings'));
  snap.forEach(doc => {
    console.log(`Document ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  process.exit(0);
}

main().catch(console.error);
