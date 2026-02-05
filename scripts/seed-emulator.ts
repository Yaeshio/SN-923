import { db } from '../lib/firebase';
import { projects, parts, partItems } from '../app/data';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// @ts-ignore
process.env.NODE_ENV = 'development';

async function seed() {
    console.log('Seeding Firestore Emulator...');
    console.log('Connecting to Firestore (ensure Emulator is running on localhost:8080)...');

    // Projects
    console.log('Seeding Projects...');
    for (const project of projects) {
        const projectRef = doc(db, 'projects', String(project.id));
        await setDoc(projectRef, {
            ...project,
            // Ensure dates are compatible if strings
        });
    }

    // Parts
    console.log('Seeding Parts...');
    for (const part of parts) {
        const partRef = doc(db, 'parts', String(part.id));
        await setDoc(partRef, part);
    }

    // PartItems
    console.log('Seeding PartItems...');
    for (const item of partItems) {
        const itemRef = doc(db, 'partItems', String(item.id));
        await setDoc(itemRef, {
            ...item,
            // Convert Date object to Timestamp or keep as Date
            completed_at: item.completed_at ? item.completed_at : null,
            updated_at: serverTimestamp()
        });
    }

    console.log('Seeding completed!');
    process.exit(0);
}

seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
