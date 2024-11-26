import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LiveChatWidgetModule } from '@livechat/widget-angular'
import { FormsModule } from '@angular/forms';  // Import FormsModule here
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,LiveChatWidgetModule,
    FormsModule // Add FormsModule to the imports array
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
