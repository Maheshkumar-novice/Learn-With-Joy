export const firebaseConfig = {
  apiKey: "AIzaSyAj6K0uc5wOpiybFH3nU31MbVcNyeyLuYU",
  authDomain: "learn-with-joy.firebaseapp.com",
  projectId: "learn-with-joy",
  storageBucket: "learn-with-joy.appspot.com",
  messagingSenderId: "895559396675",
  appId: "1:895559396675:web:8d9c751063234b6efc13f6",
  measurementId: "G-8ZMNXHGZ6H",
  databaseURL:
    "https://learn-with-joy-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

export const actionCodeVerify = {
  url: 'https://learn-with-joy.web.app/home.html'
}

export const actionCodePasswordReset = {
  url: 'https://learn-with-joy.web.app/reset_password.html'
}

// ----------------------------------------Authentication-------------------------------------

// Google sign In
export async function userSignIn(auth, provider) {
  auth.signInWithPopup(provider).catch((error) => {});
}

// Email Sign Up
export async function userEmailSignUp(auth, email, password){
  return await auth.createUserWithEmailAndPassword(email, password);
}

// Email Sign In
export async function userEmailLogIn(auth, email, password){
  return await auth.signInWithEmailAndPassword(email, password);
}

// E-Mail verification
export async function userEmailVerification(user, actionCode){
  return await user.sendEmailVerification(actionCode);
}

// Password reset main
export async function userPasswordReset(auth, email, actionCode){
  return await auth.sendPasswordResetEmail(email, actionCode);
}

// Sign Out
export async function userSignOut(auth) {
  auth.signOut();
}

// ----------------------------------------Database-------------------------------------

// write data
export function writeDB(db, referencce, value) {
  db.ref(referencce).set(value);
}

// child data
export function addChlidDB(db, referencce, key, value) {
  db.ref(referencce).child(key).set(value);
}

// read data
export async function readDB(db, reference) {
  return await db.ref(reference).get();
}

//update data
export async function updateDB(db, reference, value) {
  db.ref(reference).update(value);
}

// remove data
export async function removeDB(db, referencce) {
  db.ref(referencce).remove();
}

// create key for a post
export function pushKey(db, reference, key) {
  return db.ref(reference).child(key).push().key;
}

// set Listener
export function setDBListener(db, reference, type, callBack) {
  db.ref(reference).on(type, callBack);
}

// ----------------------------------------firestorage-------------------------------------

// storage refrence
export function storageRef(st, reference, file){
    return st.ref(reference).child(file);
}

// upload file
export function storageUpload(reference, file, metadata){
    return reference.put(file, metadata);
}

// download file
export async function storageDownloadURL(referencce){
    return await referencce.getDownloadURL();
}

// list all Files
export async function storageList(st, reference){
    return await st.ref(reference).listAll();
}

// delete file
export async function storageDelete(item){
    return await item.delete();
}

// Meta Data
export async function fileMetaData(reference){
  return await reference.getMetadata();
}