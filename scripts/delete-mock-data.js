// =====================================================
// DELETE MOCK DATA SCRIPT
// Removes all mock data created by add-mock-data.js
// Identifies mock data by "MOCK_" prefix
// =====================================================

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, startsWith } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfvFo67UbV1j_TWLJp2eq98-7JWBmUKNs",
  authDomain: "your-reviews-app-1755877051.firebaseapp.com",
  projectId: "your-reviews-app-1755877051",
  storageBucket: "your-reviews-app-1755877051.firebasestorage.app",
  messagingSenderId: "618063827581",
  appId: "1:618063827581:web:afdb9b9c55bd53d7f15714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteMockData() {
  console.log('🗑️  Deleting all mock data...');

  try {
    let totalDeleted = 0;

    // Collections to clean and their ID patterns
    const collectionsToClean = [
      { name: 'businesses', pattern: 'MOCK_' },
      { name: 'reviews', pattern: 'MOCK_' },
      { name: 'review_responses', pattern: null }, // Will check businessId field
      { name: 'daily_stats', pattern: 'MOCK_' },
      { name: 'alert_settings', pattern: 'MOCK_' }
    ];

    for (const { name, pattern } of collectionsToClean) {
      console.log(`\n🔍 Checking ${name} collection...`);

      const collectionRef = collection(db, name);
      let querySnapshot;

      if (pattern) {
        // Query documents with IDs starting with pattern
        querySnapshot = await getDocs(collectionRef);
        
        for (const docSnapshot of querySnapshot.docs) {
          if (docSnapshot.id.startsWith(pattern)) {
            await deleteDoc(doc(db, name, docSnapshot.id));
            console.log(`   ❌ Deleted ${name}/${docSnapshot.id}`);
            totalDeleted++;
          }
        }
      } else {
        // For review_responses, check businessId field
        querySnapshot = await getDocs(collectionRef);
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          if (data.businessId && data.businessId.startsWith('MOCK_')) {
            await deleteDoc(doc(db, name, docSnapshot.id));
            console.log(`   ❌ Deleted ${name}/${docSnapshot.id}`);
            totalDeleted++;
          }
        }
      }
    }

    console.log(`\n🎉 Mock data deletion completed!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log(`✅ Your database is now clean of mock data.`);

  } catch (error) {
    console.error('❌ Error deleting mock data:', error);
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL mock data from Firestore!');
console.log('📋 This includes:');
console.log('   - Mock businesses (MOCK_business_*)');
console.log('   - Mock reviews (MOCK_review_*)');
console.log('   - Mock responses (with MOCK_ businessId)');
console.log('   - Mock stats (MOCK_* daily stats)');
console.log('   - Mock alert settings (MOCK_*)');
console.log('');

// Add a small delay and auto-confirm for demo purposes
setTimeout(() => {
  console.log('🚀 Starting deletion in 3 seconds...');
  setTimeout(() => {
    deleteMockData().then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
  }, 3000);
}, 1000);
