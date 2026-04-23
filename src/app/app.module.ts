// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
//
// import { AppRoutingModule } from './app-routing.module';
// import { HttpClientModule} from '@angular/common/http';
// import {BrowserModule} from '@angular/platform-browser';
//
// @NgModule({
//   declarations: [],
//   imports: [
//     BrowserModule,
//     AppRoutingModule,
//     HttpClientModule,
//     CommonModule,
//     AppRoutingModule
//   ]
// })
// export class AppModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// For GitHub Pages routing (HashLocationStrategy)
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
  declarations: [

    // Add other components here as you create them
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule,
    AppRoutingModule,
    AppComponent
  ],
  providers: [
    // Use HashLocationStrategy for GitHub Pages compatibility
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: []
})
export class AppModule { }
