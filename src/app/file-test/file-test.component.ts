import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as jimp from 'jimp';
import { OCRProcessor, OcrResult } from '../ocr-processor';
import { OCRProcessorSobel, OcrResultSobel } from '../ocr-processor-sobel';

@Component({
    selector: 'app-file-test',
    templateUrl: './file-test.component.html',
    styleUrls: ['./file-test.component.scss']
})
export class FileTestComponent implements OnInit, AfterViewInit {
    @ViewChild('canvas', { static: false }) canvas: ElementRef<HTMLCanvasElement>;

    ocrPsmSingleBlock = true;
    MIN_R = 80;
    MAX_R = 255;
    MIN_G = 80;
    MAX_G = 255;
    MIN_B = 80;
    MAX_B = 255;

    context2d: CanvasRenderingContext2D;
    showCanvas = false;
    loading = false;

    results: OcrResult[] = [];

    initialImageContent: string;

    // image test model
    pre: boolean;
    post: boolean;
    applyGreyscale: boolean;
    applyNormalize: boolean;
    applyContrast: boolean;
    applyBrightness: boolean;
    contrast: number;
    brightness: number;

    trackInner: boolean;

    processor: OCRProcessor;

    get ocrOptions() {
        return {
            ocrPsmSingleBlock: this.ocrPsmSingleBlock,
            MIN_R: this.MIN_R,
            MIN_G: this.MIN_G,
            MIN_B: this.MIN_B,
            MAX_R: this.MAX_R,
            MAX_G: this.MAX_G,
            MAX_B: this.MAX_B,
            filters: {
                greyscale: this.post && this.applyGreyscale,
                contrast: this.post && this.applyContrast && this.contrast,
                brightness: this.post && this.applyBrightness && this.brightness,
                normalize: this.post && this.applyNormalize
            }
        };
    }

    ngOnInit() {}

    ngAfterViewInit(): void {
        this.context2d = this.canvas.nativeElement.getContext('2d');
    }

    onFileChange(event) {
        const [file] = event.target.files;
        const reader = new FileReader();
        reader.onload = e => {
            this.initialImageContent = (e.target as any).result as string;
            this.loadImage(this.initialImageContent);
        };
        reader.readAsDataURL(file);
    }

    async start(draw) {
        this.processor = new OCRProcessor(this.canvas.nativeElement);

        this.results = [];
        const img = new Image();
        img.onload = () => {
            this.context2d.drawImage(img, 0, 0);
            this.processImage(img, draw);
        };
        img.src = this.initialImageContent;
    }

    async loadImage(content) {
        const img = new Image();
        const image = await jimp.read(content);
        img.onload = () => {
            this.canvas.nativeElement.width = img.width;
            this.canvas.nativeElement.height = img.height;
            this.context2d.drawImage(img, 0, 0);
        };

        if (this.pre) {
            this.processor.applyFilters(image, this.ocrOptions);
        }

        img.src = await image.getBase64Async(image.getMIME());
    }

    async processImage(img, draw) {
        if (draw) {
            this.loading = true;
            const r: any = await this.startDrawing(img);
            this.results = await this.processor.recognizeFromRect(img.src, r, this.ocrOptions);
        } else {
            this.loading = true;
            if (this.trackInner) {
                this.results = await this.processor.trackInner(img.src, this.ocrOptions);
            } else {
                this.results = await this.processor.track(img.src, this.ocrOptions);
            }
        }
        this.loading = false;
    }

    showOcrDataAt(event, index) {
        event.preventDefault();
        this.results[index].showOcrData = !this.results[index].showOcrData;
    }

    async startDrawing(img) {
        return new Promise(resolve => {
            let x = 0;
            let y = 0;
            let width = 0;
            let height = 0;
            let drawStarted = false;

            const mouseDown = function(event) {
                drawStarted = true;
                x = event.pageX - this.offsetLeft;
                y = event.pageY - this.offsetTop;
            };

            const mouseUp = function(event) {
                drawStarted = false;
                // console.log(x, y, width, height);
                this.removeEventListener('mousedown', mouseDown);
                this.removeEventListener('mouseup', mouseUp);
                this.removeEventListener('mousemove', mouseMove);
                resolve({ x, y, width, height });
            };

            const mouseMove = function(event) {
                if (drawStarted) {
                    const context = this.getContext('2d');
                    context.drawImage(img, 0, 0);
                    width = event.pageX - this.offsetLeft - x;
                    height = event.pageY - this.offsetTop - y;
                    context.strokeStyle = '#ff0000';
                    context.lineWidth = 4;
                    context.strokeRect(x, y, width, height);
                }
            };

            this.canvas.nativeElement.addEventListener('mousedown', mouseDown);
            this.canvas.nativeElement.addEventListener('mouseup', mouseUp);
            this.canvas.nativeElement.addEventListener('mousemove', mouseMove);
        });
    }
}
