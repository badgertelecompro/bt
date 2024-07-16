import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalDataService } from '../global-data.service';
import {uploadFile} from'../../firebase/config'
import { DataService } from '../services/data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent  implements OnInit{
  ShowUser: boolean = true;
  name: string = '';
  email: string = '';
  databaseName = 'btp';
  documents: any[] = [];
  showSyncButton: boolean = false;

  constructor(private dataService: DataService,private globalDataService: GlobalDataService,private router:Router){}

  ngOnInit(): void {
    this.name = this.globalDataService.getName() || '';
    this.email = this.globalDataService.getEmail() || '';
    this.checkLocalStorage();
  }
  onSumit() {
    this.router.navigateByUrl('/register');
  }
  checkLocalStorage(): void {
    this.showSyncButton = localStorage.getItem('storedWork') !== null;
  }
  onSet()  {
    this.globalDataService.setName(this.name);
    this.globalDataService.setEmail(this.email.toUpperCase());
    const collectionName = 'works';
    const databaseName = this.databaseName;
    if(databaseName ){
      this.dataService.getCollectionData(collectionName, databaseName, this.globalDataService.getEmail() )
      .subscribe({
        next: response => {
          this.documents = response;
        },
        error: err => {
          console.log(err)
        },
        complete: () => console.log('')
      });
    }
    this.ShowUser=false;
  }
  syncData(): void {
    if (navigator.onLine) {
      const storedwork = JSON.parse(localStorage.getItem('storedWork') || '[]');
      storedwork.forEach((item: any) => {
        const formData = {
          email: item.offformData.email,
          OciusX: item.offformData.OciusX,
          date: item.offformData.date,
          name: item.offformData.name,
          gpsLocation: item.offformData.gpsLocation,
          address: item.offformData.address,
          pedType: item.offformData.pedType,
          trench: item.offformData.trench,
          trenchFootage: item.offformData.trenchFootage,
          webcamImage: item.offformData.webcamImage,
          uploadedFiles: item.offformData.uploadedFiles,
          filePath: item.offformData.filePath
        };
        this.onlineSave (formData);
        this.removeFromLocalStorage(item.offformData.workId);
      });

    }
  }

  async onlineSave (formData:any){
    const collectionName = 'works';
    const databaseName = this.databaseName;
    const {uploadedFiles, ...saveformData} = formData;
    if(databaseName ){
      try {
        const downloadURLs: { name: string; url: string; }[] = await Promise.all(uploadedFiles.map(async (element: { name: string; image: string; }) => {
          const byteString = atob(element.image.split(',')[1]);
          const mimeString = element.image.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const downloadURL = await uploadFile(blob, `${formData.filePath}/${element.name}`) as string;
          return { name: element.name, url: downloadURL };
        }));
        const dataToInsert = {
          ...saveformData,
          downloadURLs
        };
        this.dataService.insertData(collectionName, databaseName, dataToInsert)
        .subscribe({
          next: response => {},
          error: err => {
            console.log(err)
          },
          complete: () => console.log('')
        });
      } catch (error) {
        console.error('Error en la subida de archivos o inserción de datos:', error);
      }
    }
  }
  removeFromLocalStorage(fileId: number): void {
    // Elimina el archivo del localStorage después de sincronizarlo con Firebase
    const storedFiles = JSON.parse(localStorage.getItem('storedWork') || '[]');
    const updatedFiles = storedFiles.filter((file: any) => file.offformData.workId !== fileId);
    localStorage.setItem('storedWork', JSON.stringify(updatedFiles));
  }

  exportToExcel(): void {
    const dataToExport = this.documents.map(document => ({
      Date: document.date,
      Address: document.address,
      OciusX: document.OciusX,
      Email: document.email,
      Name: document.name,
      "Ped Type": document.pedType,
      Trench: document.trench,
      "Trench Footage": document.trenchFootage,
      "GPS Location": document.gpsLocation,
      "File Path": document.filePath,
      "Download Links": document.downloadURLs.map((link: { url: any; }) => link.url).join(', ') // Concatenar URLs de descarga
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'jobs_data');
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url: string = window.URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = fileName + '_export_' + new Date().getTime() + '.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}
