import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { WebcamImage } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';
import * as jimp from 'jimp';

import { OCRProcessor } from '../ocr-processor';

@Component({
    selector: 'app-webcam',
    templateUrl: './webcam.component.html',
    styleUrls: ['./webcam.component.scss']
})
export class WebcamComponent implements OnInit, AfterViewInit {
    @ViewChild('webcam', { static: false }) webcam: any;
    @ViewChild('canvas', { static: false }) canvas: ElementRef<HTMLCanvasElement>;

    webcamImage: WebcamImage;

    get triggerObservable(): Observable<void> {
        return this.trigger.asObservable();
    }

    private trigger: Subject<void> = new Subject<void>();

    constructor() {}

    ngOnInit() {}
    ngAfterViewInit() {}

    async handleImage(webcamImage: WebcamImage) {
        this.webcamImage = webcamImage;

        const context = this.canvas.nativeElement.getContext('2d');
        const image = await jimp.read(webcamImage.imageAsDataUrl);

        const img = new Image();
        img.onload = () => {
            this.canvas.nativeElement.width = img.width;
            this.canvas.nativeElement.height = img.height;
            context.drawImage(img, 0, 0);
            this.process(img.src);
        };

        img.src = await image.getBase64Async(image.getMIME());
    }

    triggerSnapshot(): void {
        this.trigger.next();
    }

    reset() {
      this.webcamImage = null;
    }

    async process(img) {
      const processor = new OCRProcessor(this.canvas.nativeElement);
      const results = await processor.track(img);
      console.log(results)
    }
}
