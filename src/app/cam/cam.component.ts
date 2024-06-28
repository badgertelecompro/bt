import { Component, OnInit } from '@angular/core';
import {Subject, Observable} from 'rxjs';
import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';

@Component({
  selector: 'app-cam',
  templateUrl: './cam.component.html',
  styleUrl: './cam.component.css'
})
export class CamComponent implements OnInit{
  public multipleWebcamsAvailable = false;
  public errors: WebcamInitError[] = [];
  private trigger: Subject<void> = new Subject<void>();
  webcamHeight: number = 500;
  webcamWidth: number = 500;
  public showWebcam = true;
  public webcamImage!: WebcamImage;


  // public allowCameraSwitch = true;
  // public deviceId!: string;

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
      this.updateWebcamSize();
      window.addEventListener('resize', () => this.updateWebcamSize());
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  updateWebcamSize() {
    if (window.innerWidth < 576) { // Pantalla pequeña
      this.webcamHeight = window.innerHeight * 0.75; // Usar un porcentaje de la altura de la pantalla
      this.webcamWidth = window.innerWidth - 25; // Usar el ancho completo de la pantalla
    } else if (window.innerWidth < 768) { // Pantalla mediana
      this.webcamHeight = 500;
      this.webcamWidth = 500;
    } else { // Pantalla grande
      this.webcamHeight = 500;
      this.webcamWidth = 500;
    }
  }

  // public cameraWasSwitched(deviceId: string): void {
  //   console.log('active device: ' + deviceId);
  //   this.deviceId = deviceId;
  // }

  // public get nextWebcamObservable(): Observable<boolean|string> {
  //     return this.nextWebcam.asObservable();
  //   }

  // public showNextWebcam(directionOrDeviceId: boolean|string): void {
  //   // true => move forward through devices
  //   // false => move backwards through devices
  //   // string => move to device with given deviceId
  //   this.nextWebcam.next(directionOrDeviceId);
  // }


}
