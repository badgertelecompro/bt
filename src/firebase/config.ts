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


export function uploadFile(file: Blob ,filePath: string ){
  const storageRef = ref(storage, filePath)
  uploadBytes(storageRef,file).then(snapshop=>{
    console.log(snapshop)
  })
}

// export function uploadFile2(file: Blob, filePath: string) {
//   const storageRef = ref(storage, filePath); // Usar filePath para definir la ruta del archivo

//   uploadBytes(storageRef, file).then(snapshot => {
//     console.log('File uploaded successfully:', snapshot);
//   }).catch(error => {
//     console.error('Error uploading file:', error);
//   });
// }
