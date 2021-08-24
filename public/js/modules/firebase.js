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

// write data
export function writeDB(db, referencce, value){
    db.ref(referencce).set(value);
}

// child data
export function addChlidDB(db, referencce, key, value){
    db.ref(referencce).child(key).set(value)
}

// read data
export async function readDB(db, reference){
    return await db.ref(reference).get();
}

//update data
export async function updateDB(db, reference, value){
    db.ref(reference).update(value);
}

// remove data
export async function removeDB(db, referencce){
    db.ref(referencce).remove();
}

// create key for a post
export function pushKey(db, reference, key){
    return db.ref(reference).child(key).push().key;
}

// set Listener
export function setDBListener(db, reference, type, callBack) {
    db.ref(reference).on(type, callBack);
  }