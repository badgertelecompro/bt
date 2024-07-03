import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { GeolocationService } from '../services/GeolocationService.service';
import {uploadFile} from'../../firebase/config'
import { DataService } from '../services/data.service';
import { GlobalDataService } from '../global-data.service';
import { Router } from '@angular/router';
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
  public currentLatitude: number | undefined;
  public currentLongitude: number | undefined;
  public locate :string |undefined;
  public city :string |undefined;
  public suburb :string |undefined;
  public road :string |undefined;
  public state :string |undefined;
  public postcode :string |undefined;
  public county :string |undefined;
  public combinedText :string |undefined;
  public date = new Date().toLocaleString();
  public isLoading = true;
  public locationError: string | null = null;
  public uploadedFiles: UploadedFile[] = [];
  private fileCounter = 0;
  public isSupportSelected = false;
  private databaseName :string | undefined;
  private dataSource :string | undefined;
  private selectedPedTypeText: string = '';
  //#endregion


  constructor(private router:Router,private globalDataService: GlobalDataService,private dataService: DataService,private geolocationService: GeolocationService) {}

  public ngOnInit(): void {
    this.databaseName = 'btp';
    this.dataSource = 'Cluster0';
    this.getPosition();
    WebcamUtil.getAvailableVideoInputs().then((mediaDevices: MediaDeviceInfo[]) => {
      this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
    });
    this.updateWebcamSize();
    window.addEventListener('resize', () => this.updateWebcamSize());
  }
  return() {
    this.router.navigateByUrl('/list');
  }

  //#region Form
  onPedTypeChange(event: Event):void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPedTypeText = selectElement.options[selectElement.selectedIndex].text;
  }
  onSupportChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.isSupportSelected = selectElement.value !== '';
  }
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
  cleanText(text: string): string {
    return text.replace(/[^\w\s]/gi, '');
  }

  // Función para guardar los datos
  saveData() {
    const filePath = `${this.suburb} ${this.road} ${this.county} ${this.city} ${this.postcode} ${this.state}`
    const formData = {
      email: this.globalDataService.getEmail(),
      name: this.globalDataService.getName(),
      date: this.date,
      gpsLocation: `${this.currentLatitude}, ${this.currentLongitude}`,
      address: `${this.suburb} ${this.road} ${this.county} ${this.city} ${this.postcode} ${this.state}`,
      pedType: this.selectedPedTypeText,
      trench: (document.querySelector('input[name="trench"]:checked') as HTMLInputElement)?.value,
      trenchFootage: (document.getElementById('trench-footage') as HTMLTextAreaElement).value,
      uploadedFiles: this.uploadedFiles,
      filePath: filePath
    };

    if (navigator.onLine) {
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
        uploadFile(blob,`${filePath}/${element.name}` );
      });
    } else {
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
    this.resetForm();
    this.router.navigateByUrl('/list');
  }

  // Función para reiniciar el formulario después de guardar los datos
  resetForm() {
    this.date = new Date().toLocaleDateString();
    this.currentLatitude = 0; // Reiniciar la latitud
    this.currentLongitude = 0; // Reiniciar la longitud
    this.suburb = 'Sandy Oaks';
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
    this.getLocation();
    this.webcamImage = webcamImage;
    if (this.currentLatitude !== undefined && this.currentLongitude !== undefined && this.combinedText !== undefined) {
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
  }
  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
    this.scrollToTop();
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
  public getLocation(): void {
      this.getPosition();
      // this.currentLatitude = 29.562743464887873;
      // this.currentLongitude = -98.53672741262507;
    if (this.currentLatitude !== undefined && this.currentLongitude !== undefined) {
      this.geolocationService.getLocation(this.currentLatitude, this.currentLongitude)
        .then((location: any) => {
          this.locate = `lat: ${this.currentLatitude}, lon: ${this.currentLongitude}`;
          this.city = location.address.city || location.address.town || location.address.village || 'City';
          this.suburb = location.address.house_number ||'';
          this.road = location.address.road || '';
          this.state = location.address.state || location.address.country;
          this.county = location.address.county || '';
          this.postcode = location.address.postcode || location.address.country;
          this.combinedText = `${this.date}\n${this.locate}\n${this.suburb} ${this.road}\n${this.county}\n${this.city}\n${this.postcode}\n${this.state}`;
          this.isLoading = false;
        })
        .catch((error) => {
          this.locationError = 'Error fetching location';
          this.isLoading = false;
        });
    } else {
      this.locationError = 'No se ha obtenido la ubicación aún.';
      this.isLoading = false;
    }
  }

  private getPosition(): void {
    this.isLoading = true;
    this.locationError = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLatitude = position.coords.latitude;
          this.currentLongitude = position.coords.longitude;
          this.getLocation();
        },
        (error) => {
          this.locationError = 'Error al obtener la ubicación';
          this.isLoading = false;
        }
      );
    } else {
      this.locationError = 'Geolocalización no soportada por este navegador';
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
