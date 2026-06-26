import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

if (window === window.parent) {
    bootstrapApplication(AppComponent, appConfig).catch((err) => {
        if (err?.code !== 5104) console.error(err);
    });
}
