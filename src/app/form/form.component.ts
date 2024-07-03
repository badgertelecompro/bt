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
  dataSource = 'Cluster0';
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
  onSet() {
    this.globalDataService.setName(this.name);
    this.globalDataService.setEmail(this.email);
    const collectionName = 'works';
    const databaseName = this.databaseName;
    const dataSource = this.dataSource;
    if(databaseName && dataSource)
      this.dataService.getCollectionData(collectionName, databaseName, dataSource,this.globalDataService.getEmail() )
      .subscribe(
        response => {
        if (response.documents) {
          this.documents = response.documents;
        } else {
          this.documents = response; // Si no, asigna la respuesta directamente
        }
        },
        error => console.error('Error al consultar:', error)
      );
    this.ShowUser=false;
  }

  checkData() {
    console.log('Nombre:', this.globalDataService.getName());
    console.log('Correo:', this.globalDataService.getEmail());
    this.ShowUser = false;
    this.syncData();
  }

  syncData(): void {
    if (navigator.onLine) {
      const storedwork = JSON.parse(localStorage.getItem('storedWork') || '[]');
      storedwork.forEach((item: any) => {
        const formData = {
          email: item.offformData.email,
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
        const collectionName = 'works';
        const databaseName = this.databaseName;
        const dataSource = this.dataSource;
        const {uploadedFiles, ...saveformData} = formData;
        if(databaseName && dataSource)
          this.dataService.insertData(collectionName, databaseName, dataSource, saveformData)
          .subscribe(
            response => console.log('Inserción exitosa:', response),
            error => console.error('Error al insertar:', error)
          );
        uploadedFiles.forEach((element: { name:string;image: string; }) => {
          const byteString = atob(element.image.split(',')[1]);
          const mimeString = element.image.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          uploadFile(blob,`${formData.filePath}/${element.name}`);
        });
        this.removeFromLocalStorage(item.offformData.workId);
      });

    }
  }
  removeFromLocalStorage(fileId: number): void {
    // Elimina el archivo del localStorage después de sincronizarlo con Firebase
    const storedFiles = JSON.parse(localStorage.getItem('storedWork') || '[]');
    const updatedFiles = storedFiles.filter((file: any) => file.offformData.workId !== fileId);
    localStorage.setItem('storedWork', JSON.stringify(updatedFiles));
  }

  exportToExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.documents);
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
