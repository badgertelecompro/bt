import { initializeApp } from "firebase/app";
import {getDownloadURL, getStorage,ref,uploadBytes } from 'firebase/storage';

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
export const storage = getStorage(app);


export function uploadFile(file: Blob ,filePath: string ){
  const storageRef = ref(storage, filePath)
  return new Promise((resolve, reject) => {
    uploadBytes(storageRef, file).then(snapshot => {
      getDownloadURL(storageRef).then(downloadURL => {
        resolve(downloadURL);
      }).catch(error => {
        reject(error);
      });
    }).catch(error => {
      reject(error);
    });
  });
}
