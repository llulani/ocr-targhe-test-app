import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgModule, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { WebcamModule } from 'ngx-webcam';

import { AppComponent } from './app.component';
import { WebcamComponent } from './webcam/webcam.component';
import { FileTestComponent } from './file-test/file-test.component';

@NgModule({
    declarations: [AppComponent, WebcamComponent, FileTestComponent],
    imports: [
        BrowserModule,
        FormsModule,
        FlexLayoutModule,
        WebcamModule,
        RouterModule.forRoot([
            { path: '', redirectTo: '/file-test', pathMatch: 'full' },
            { path: 'file-test', component: FileTestComponent },
            { path: 'webcam', component: WebcamComponent }
        ])
    ],
    entryComponents: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}
