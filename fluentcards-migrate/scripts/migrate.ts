import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function migrate() {
  console.log('Migrating decks...');
  const decksSnap = await getDocs(collection(db, 'decks'));
  for (const docSnap of decksSnap.docs) {
    const data = docSnap.data();
    if (data.isPublic === undefined) {
      console.log('Updating deck', docSnap.id);
      await updateDoc(doc(db, 'decks', docSnap.id), { isPublic: false, authorName: 'Anonymous' });
    }
  }

  console.log('Migrating cards...');
  const cardsSnap = await getDocs(collection(db, 'cards'));
  for (const docSnap of cardsSnap.docs) {
    const data = docSnap.data();
    if (data.isPublic === undefined) {
      console.log('Updating card', docSnap.id);
      await updateDoc(doc(db, 'cards', docSnap.id), { isPublic: false });
    }
  }
  
  console.log('Done.');
  process.exit(0);
}

migrate().catch(console.error);
