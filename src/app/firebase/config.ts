import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getStorage,ref,uploadBytes } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyASq-OvD_CytkoRSNyaenrnAHx6OVHP2yY",
  authDomain: "badgertelecompro-6ab2d.firebaseapp.com",
  projectId: "badgertelecompro-6ab2d",
  storageBucket: "badgertelecompro-6ab2d.appspot.com",
  messagingSenderId: "701191459197",
  appId: "1:701191459197:web:9e5e0e0a80a25b67b33c14",
  measurementId: "G-14GZ8Q41ZW"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);


export function uploadFile(file: Blob  ){
  debugger
  const storageRef = ref(storage, 'som-child')
  uploadBytes(storageRef,file).then(snapshop=>{
    console.log(snapshop)
  })
}
