import { createWorker, OEM, PSM, Worker } from 'tesseract.js';
import * as jimp from 'jimp';
const tracking = (window as any).tracking;

interface OCRProcessorOptions {
    // ocr test model
    ocrPsmSingleBlock: boolean;

    // color tracker
    MIN_R: number;
    MAX_R: number;
    MIN_G: number;
    MAX_G: number;
    MIN_B: number;
    MAX_B: number;

    // filters
    filters?: {
        greyscale?: boolean;
        contrast?: number;
        brightness?: number;
        normalize?: boolean;
    };
}

export const DEFAULT_OPTIONS: OCRProcessorOptions = {
    ocrPsmSingleBlock: true,
    MIN_R: 80,
    MAX_R: 255,
    MIN_G: 80,
    MAX_G: 255,
    MIN_B: 80,
    MAX_B: 255
};

export interface OcrResultSobel {
    image?: any;
    ocrData?: any;
    targa?: string;
    showOcrData?: boolean;
    open?: boolean;
}

export class OCRProcessorSobel {
    worker: Worker;
    rects = [];
    context2d: CanvasRenderingContext2D;

    constructor(public canvas: HTMLCanvasElement, public options: OCRProcessorOptions = DEFAULT_OPTIONS) {
        this.rects = [];
        this.context2d = this.canvas.getContext('2d');
    }

    private async initTesseract() {
        this.worker = createWorker({
            // logger: m => console.log(m)
        });
        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng', OEM.LSTM_ONLY);
        await this.worker.setParameters({
            tessedit_char_whitelist: '0123456789QWERTYUIOPASDFGHJKLZXCVBNM',
            tessedit_pageseg_mode: this.options.ocrPsmSingleBlock ? PSM.SINGLE_BLOCK : PSM.SINGLE_LINE
        });
    }

    async track(imageData, width, height): Promise<OcrResultSobel[]> {
        return new Promise(resolve => {
            const gray = tracking.Image.sobel(imageData, width, height);
            for (let i = 0; i < gray.length; i++) {
                imageData.data[i] = gray[i];
            }

            const context = this.context2d;
            context.clearRect(0, 0, width, height);
            context.putImageData(imageData, 0, 0);
            resolve();
        });
    }

    private async cropAndRecognize(imageData) {
        const results: OcrResultSobel[] = [];

        await this.initTesseract();

        for (const r of this.rects) {
            const image = await jimp.read(imageData);
            image.crop(r.x, r.y, r.width, r.height);

            const mask = await new jimp(r.width, r.height, '#a4a4a4');
            const convolutionMatrixEdge = [
                [-1, -1, -1],
                [-1, 8, -1],
                [-1, -1, -1]
            ];

            const convolutionMatrixSoften = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];

            if (this.options.filters) {
                this.applyFilters(image);
            }

            const croppedImage = await new Promise(resolve => {
                image.getBase64(image.getMIME(), (err, data) => {
                    resolve(data);
                });
            });

            const ocrRecognizedData = await this.ocr(croppedImage);
            const targa = this.findTarghe(ocrRecognizedData);
            results.push({
                image: croppedImage,
                ocrData: ocrRecognizedData,
                targa,
                showOcrData: false,
                open: !!targa
            });
        }
        await this.worker.terminate();
        return results;
    }

    private async ocr(img) {
        const { data } = await this.worker.recognize(img);
        return data;
    }

    private findTarghe(data) {
        const re = /\w{2}\w{3}\w{2}/g;
        for (const line of data.lines) {
            const lineText = '' + line.text.replace(/[&\/\\#,+()\-\[\]$~%.'":*?°‘’`<>\{\}\s]/g, '').toUpperCase();
            const lineLen = lineText.length;
            const results = [];
            if (lineLen >= 7) {
                for (let i = 0; i <= lineLen - 7; i++) {
                    const text = lineText.substr(i, 7);
                    const match = text.match(re);
                    if (match && match.length > 0) {
                        const first = match[0]
                            .substr(0, 2)
                            .replace('1', 'T')
                            .match(/[a-zA-Z]{2}/);

                        const middle = match[0]
                            .substr(2, 3)
                            .replace('S', '5')
                            .replace('O', '0')
                            .replace('I', '1')
                            .replace('T', '1')
                            .replace('Z', '7')
                            .match(/\d{3}/);

                        const last = match[0]
                            .substring(5)
                            .replace('1', 'T')
                            .replace('7', 'Z')
                            .replace('8', 'Z')
                            .match(/[a-zA-Z]{2}/);

                        if (first && middle && last) {
                            return first[0] + middle[0] + last[0];
                        }
                    }
                }
            }
        }

        return null;
    }

    applyFilters(image) {
        if (this.options.filters.greyscale) {
            image.greyscale();
        }

        if (this.options.filters.contrast) {
            image.contrast(this.options.filters.contrast);
        }

        if (this.options.filters.brightness) {
            image.brightness(this.options.filters.brightness);
        }

        if (this.options.filters.normalize) {
            image.normalize();
        }
    }

    async recognizeFromRect(imageData, r: { x; y; width; height }) {
        const results = [];
        const image = await jimp.read(imageData);
        image.crop(r.x, r.y, r.width, r.height);

        if (this.options.filters) {
            this.applyFilters(image);
        }

        const croppedImage = await new Promise(resolve => {
            image.getBase64(image.getMIME(), (err, data) => {
                resolve(data);
            });
        });

        await this.initTesseract();
        const ocrRecognizedData = await this.ocr(croppedImage);
        const targa = this.findTarghe(ocrRecognizedData);
        results.push({
            image: croppedImage,
            ocrData: ocrRecognizedData,
            targa,
            showOcrData: false,
            open: !!targa
        });
        await this.worker.terminate();
        return results;
    }
}
