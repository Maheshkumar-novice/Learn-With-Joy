export const firebaseConfig = {
  apiKey: "AIzaSyAj6K0uc5wOpiybFH3nU31MbVcNyeyLuYU",
  authDomain: "learn-with-joy.firebaseapp.com",
  projectId: "learn-with-joy",
  storageBucket: "learn-with-joy.appspot.com",
  messagingSenderId: "895559396675",
  appId: "1:895559396675:web:8d9c751063234b6efc13f6",
  measurementId: "G-8ZMNXHGZ6H",
  databaseURL: "https://learn-with-joy-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// sign In
export async function userSignIn(auth, provider){
    auth.signInWithPopup(provider).catch(error => {
        
    });
}

// Sign Out
export async function userSignOut(auth){
    auth.signOut();
}

// push data
export function writeDB(db, referencce, value){
    db.ref(referencce).set(value);
}

// read data
export async function readDB(db, reference){
    return await db.ref(reference).get();
}

