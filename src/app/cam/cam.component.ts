import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { GeolocationService } from '../services/GeolocationService.service';
import {uploadFile} from'../../firebase/config'
import { DataService } from '../services/data.service';
import { GlobalDataService } from '../global-data.service';
import { Router } from '@angular/router';
import { compress } from 'image-conversion';

interface UploadedFile {
  id: number;
  name: string;
  support: string;
  image:string;
}
@Component({
  selector: 'app-cam',
  templateUrl: './cam.component.html',
  styleUrls: ['./cam.component.css']
})
export class CamComponent implements OnInit {
  //#region attributes
  public multipleWebcamsAvailable = false;
  public errors: WebcamInitError[] = [];
  private trigger: Subject<void> = new Subject<void>();
  public webcamHeight: number = 500;
  public webcamWidth: number = 500;
  public showWebcam = false;
  public webcamImage!: WebcamImage;
  public webcamImageWithText!: string;
  public currentLatitude: number = 0;
  public currentLongitude: number =0;
  public locate :string ='';
  public city :string ='';
  public house_number :string ='';
  public road :string ='';
  public state :string ='';
  public postcode :string ='';
  public county :string ='';
  public combinedText :string ='';
  public date = new Date().toLocaleString();
  public isLoading = true;
  public locationError: string | null = null;
  public uploadedFiles: UploadedFile[] = [];
  private fileCounter = 0;
  public isSupportSelected = false;
  private databaseName :string | undefined;
  private selectedPedTypeText: string = '';
  private locationRetrieved: boolean = false;
  private selectedOciusXText: string = 'Complete';
  private watchPositionId: number | null = null;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  //#endregion

  constructor(private router:Router,private globalDataService: GlobalDataService,private dataService: DataService,private geolocationService: GeolocationService) {}

  public ngOnInit(): void {
    this.databaseName = 'btp';
    this.locationRetrieved = false;
    // this.getPosition();
    WebcamUtil.getAvailableVideoInputs().then((mediaDevices: MediaDeviceInfo[]) => {
      this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
    });
    this.updateWebcamSize();
    window.addEventListener('resize', () => this.updateWebcamSize());
    this.startWatchingPosition();
  }
  //#region Events
  return() {
    this.router.navigateByUrl('/list');
  }

  onFirstInputChange(event: Event) {
      this.house_number = (event.target as HTMLInputElement).value;
  }
  onPedTypeChange(event: Event):void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPedTypeText = selectElement.options[selectElement.selectedIndex].text;
  }
  onSupportChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.isSupportSelected = selectElement.value !== '';
  }
  onOciusXChange(event: Event):void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedOciusXText = selectElement.options[selectElement.selectedIndex].text;
  }
  //#endregion

  //#region File
  addFile() {
    const fileId = ++this.fileCounter;
    const supportSelect = document.getElementById('support') as HTMLSelectElement;
    const selectedSupport = supportSelect.options[supportSelect.selectedIndex].text;
    const imageDataUrl = this.webcamImageWithText;
    this.isSupportSelected = false;
    const fileName = `${fileId}_${this.cleanText(selectedSupport)}`;
    this.uploadedFiles.push({
      id: fileId,
      name: fileName,
      support: selectedSupport,
      image:imageDataUrl
    });
    this.webcamImageWithText = '';
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.convertToBase64(file);
  }

  convertToBase64(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.webcamImageWithText = reader.result as string;
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    };
    reader.onerror = (error) => {
      console.error('Error: ', error);
    };
  }

  eliminarArchivo(id: number) {
    this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== id);
  }
  b64toBlob(b64Data: string): Blob {
    const byteString = atob(b64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab]);
}

  //#endregion

  //#region Form
  cleanText(text: string): string {
    return text.replace(/[^\w\s]/gi, '');
  }
  saveData() {
    const filePath = `${this.house_number} ${this.road} ${this.county} ${this.city} ${this.postcode} ${this.state}`
    const formData = {
      email: this.globalDataService.getEmail(),
      name: this.globalDataService.getName(),
      OciusX: this.selectedOciusXText,
      date: this.date,
      gpsLocation: `${this.currentLatitude}, ${this.currentLongitude}`,
      address: `${this.house_number} ${this.road} ${this.county} ${this.city} ${this.postcode} ${this.state}`,
      pedType: this.selectedPedTypeText,
      trench: (document.querySelector('input[name="trench"]:checked') as HTMLInputElement)?.value,
      trenchFootage: (document.getElementById('trench-footage') as HTMLTextAreaElement).value,
      uploadedFiles: this.uploadedFiles,
      filePath: filePath
    };

    if (navigator.onLine) {
      this.onlineSave(formData,filePath);
    } else {
      this.offLineSave(formData);
    }
    this.resetForm();
    this.router.navigateByUrl('/list');
  }
  async onlineSave (formData:any,filePath:string){
    const collectionName = 'works';
    const databaseName = this.databaseName;
    const {uploadedFiles, ...saveformData} = formData;
    if(databaseName ){
      try {
        const downloadURLs: { name: string; url: string; }[] = await Promise.all(uploadedFiles.map(async (element: { name: string; image: string; }) => {
          try {
              // Convertir base64 a Blob
              const base64String = element.image.split(',')[1];
              const blob = this.b64toBlob(base64String);

              // Comprimir la imagen Blob
              const compressedBlob = await compress(blob, {
                  maxSizeMB: 1, // Tamaño máximo deseado en MB
                  maxWidthOrHeight: 1920, // Ancho o altura máxima permitida
              });

              // Subir el Blob comprimido
              const downloadURL = await uploadFile(compressedBlob, `${filePath}/${element.name}`) as string;
              return { name: element.name, url: downloadURL };
          } catch (error) {
              console.error('Error al procesar imagen:', error);
              return { name: element.name, url: '' }; // Manejar el error según sea necesario
          }
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
  offLineSave(formData:any){
    const workId = ++this.fileCounter;
    const offformData = {
      workId:workId,
      ...formData
    }
    const storedWork = JSON.parse(localStorage.getItem('storedWork') || '[]');
    storedWork.push({
      offformData
    });
    localStorage.setItem('storedWork', JSON.stringify(storedWork));
  }
  // Función para reiniciar el formulario después de guardar los datos
  resetForm() {
    this.date = new Date().toLocaleDateString();
    this.currentLatitude = 0; // Reiniciar la latitud
    this.currentLongitude = 0; // Reiniciar la longitud
    this.house_number = 'Sandy Oaks';
    this.road = 'Main St';
    this.county = 'County';
    this.city = 'City';
    this.postcode = '12345';
    this.state = 'State';
    this.uploadedFiles = [];
    this.errors = [];
    this.isSupportSelected = false;
    // Reiniciar otros campos según sea necesario
  }


  //#endregion

  //#region Image
  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    if (this.currentLatitude !== 0 && this.currentLongitude !== 0 && this.combinedText !== '') {
      this.combinedTextF();
      this.addTextToImage(webcamImage.imageAsDataUrl, this.combinedText );
    } else {
      const combinedText = `Unknown Location\n${this.date}`;
      this.addTextToImage(webcamImage.imageAsDataUrl, combinedText);
    }
  }
  private addTextToImage(imageDataUrl: string, text: string): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const image = new Image();
    image.crossOrigin = 'Anonymous';

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;

      context.drawImage(image, 0, 0);

      const lines = text.split('\n');
      const fontSize = 20;
      const lineHeight = fontSize * 1;
      context.font = `${fontSize}px Arial`;
      context.fillStyle = 'white';
      context.textAlign = 'right';

      let yPosition = image.height - 10 - (lines.length * lineHeight);

      lines.forEach((line, index) => {
        context.fillText(line, image.width - 10, yPosition + (index * lineHeight));
      });

      this.webcamImageWithText = canvas.toDataURL('image/jpeg');
    };

    image.onerror = (error) => {
      console.error('Error al cargar la imagen:', error);
    };

    image.src = imageDataUrl;
  }
  //#endregion

  //#region Cam
  public triggerSnapshot(): void {
    this.showWebcam = false;
    this.trigger.next();
    this.scrollToBottom();
    this.locationRetrieved = false;
  }
  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
    this.scrollToTop();
    this.locationRetrieved = false;
  }
  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }
  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
  private updateWebcamSize() {
    if (window.innerWidth < 576) {
      this.webcamHeight = window.innerHeight * 0.75;
      this.webcamWidth = window.innerWidth - 25;
    } else if (window.innerWidth < 768) {
      this.webcamHeight = 500;
      this.webcamWidth = 500;
    } else {
      this.webcamHeight = 500;
      this.webcamWidth = 500;
    }
  }
  //#endregion

  //#region Location
  // public getLocation(): void {
  //   // this.getPosition();
  //   if (this.currentLatitude !== 0 && this.currentLongitude !== 0) {
  //     this.getLocation2()
  //   //   this.geolocationService.getLocation(this.currentLatitude, this.currentLongitude)
  //   //     .then((location: any) => {
  //   //       if(location.address){
  //   //         this.locate = `lat: ${this.currentLatitude}, lon: ${this.currentLongitude}`;
  //   //         this.city = location.address.city || location.address.town || location.address.village || 'City';
  //   //         this.house_number = location.address.house_number ||'';
  //   //         this.road = location.address.road || '';
  //   //         this.state = location.address.state || location.address.country;
  //   //         this.county = location.address.county || '';
  //   //         this.postcode = location.address.postcode || location.address.country;
  //   //         this.isLoading = false;
  //   //       }else{
  //   //       }
  //   //     })
  //   //     .catch((error) => {
  //   //       this.locationError = 'Error fetching location';
  //   //       this.isLoading = false;
  //   //     });
  //   // } else {
  //   //   this.locationError = 'No se ha obtenido la ubicación aún.';
  //   //   this.isLoading = false;
  //   }
  //   this.combinedTextF();
  // }

  private combinedTextF():void{
    this.combinedText = `${this.date}\n${this.locate}\n${this.house_number} ${this.road}\n${this.county}\n${this.city}\n${this.postcode}\n${this.state}`;
  }

  public getLocation2():void{
    if (this.currentLatitude !== 0 && this.currentLongitude !== 0)
      this.geolocationService.getLocation2(this.currentLatitude, this.currentLongitude)
      .then((results: any) => {
        this.locate = `lat: ${this.currentLatitude}, lon: ${this.currentLongitude}`;
        this.city = results.results[0].components.city || results.results[0].components.town || results.results[0].components.village || 'City';
        this.house_number = results.results[0].components.house_number ||'';
        this.road = results.results[0].components.road || '';
        this.state = results.results[0].components.state || results.results[0].components.country||'';
        this.county = results.results[0].components.county || '';
        this.postcode = results.results[0].components.postcode || results.results[0].components.country||'';
        this.combinedText = `${this.date}\n${this.locate}\n${this.house_number} ${this.road}\n${this.county}\n${this.city}\n${this.postcode}\n${this.state}`;
        this.isLoading = false;
      })
      .catch((error) => {
        this.locationError = 'Error fetching location' + error;
        this.isLoading = false;
      });
  }
  public reload(){
    this.locationRetrieved = false;
    // this.getPosition();
    this.startWatchingPosition();
  }
  // private getPosition(): void {
  //   this.isLoading = true;
  //   this.locationError = null;

  //   if (navigator.geolocation) {
  //     // Opciones para mejorar la precisión
  //     const options = {
  //       enableHighAccuracy: true, // Usar GPS si está disponible
  //       timeout: 30000, // Tiempo máximo de espera
  //       maximumAge: 0 // No usar una ubicación en caché
  //     };
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         this.currentLatitude = position.coords.latitude;
  //         this.currentLongitude = position.coords.longitude; // Llama a tu función para manejar la ubicación
  //         this.isLoading = false;
  //         if (!this.locationRetrieved && this.currentLatitude !== 0) {
  //           this.locationRetrieved = true;
  //           this.getLocation2();
  //         }

  //       },
  //       (error) => {
  //         this.handleLocationError(error); // Manejo de errores mejorado
  //         this.isLoading = false; // Termina el proceso de carga
  //       },
  //       options // Aplicar opciones de precisión
  //     );
  //   } else {
  //     this.locationError = 'Geolocalización no soportada por este navegador';
  //     this.isLoading = false; // Termina el proceso de carga
  //   }
  // }

  private handleLocationError(error: GeolocationPositionError): void {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        this.locationError = 'El usuario denegó la solicitud de Geolocalización.';
        break;
      case error.POSITION_UNAVAILABLE:
        this.locationError = 'La información de la ubicación no está disponible.';
        break;
      case error.TIMEOUT:
        this.locationError = 'La solicitud para obtener la ubicación ha expirado.';
        break;
      default:
        this.locationError = 'Error desconocido al obtener la ubicación.';
        break;
    }
  }

  private startWatchingPosition(): void {
    this.isLoading = true;
    this.locationError = null;

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      };

      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentLatitude = position.coords.latitude;
          this.currentLongitude = position.coords.longitude;
          this.isLoading = false;

          if (!this.locationRetrieved && this.currentLatitude !== 0) {
            this.locationRetrieved = true;
            this.getLocation2();
          }
        },
        (error) => {
          this.handleLocationError(error);
          this.isLoading = false;
        },
        options
      );

      // Detener la observación después de 10 segundos
      setTimeout(() => {
        this.stopWatchingPosition();
      }, 10000); // 10000 milisegundos = 10 segundos
    } else {
      this.locationError = 'Geolocalización no soportada por este navegador';
      this.isLoading = false;
    }
  }

  private stopWatchingPosition(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
      this.isLoading = false;
    }
  }
  //#endregion

  //#region pantalla
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }


  //#endregion

}
