import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyA_KJ-HYpnA2_L6sQpTJc0CvjOcwwj3e7g",
  authDomain: "smart-content-creator-wp.firebaseapp.com",
  projectId: "smart-content-creator-wp",
  storageBucket: "smart-content-creator-wp.appspot.com",
  messagingSenderId: "483726954392",
  appId: "1:483726954392:web:d742bcfe4e1d4c7c8ed3b4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
