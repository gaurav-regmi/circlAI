import { NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { EventsListComponent } from './features/events/events-list/events-list.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { CreateEventComponent } from './features/events/create-event/create-event.component';
import { ChatComponent } from './features/chat/chat.component';
import { ActivityFeedComponent } from './features/activity/activity-feed.component';
import { ProfileComponent } from './features/profile/profile.component';
import { LocationAutocompleteComponent } from './shared/location-picker/location-autocomplete.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { EventChatbotComponent } from './shared/event-chatbot/event-chatbot.component';
import { EditEventComponent } from './features/events/edit-event/edit-event.component';
import { PeopleComponent } from './features/people/people.component';
import { UserProfileComponent } from './features/people/user-profile.component';

@NgModule({
  declarations: [
    App,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    EventsListComponent,
    EventDetailComponent,
    CreateEventComponent,
    ChatComponent,
    ActivityFeedComponent,
    ProfileComponent,
    LocationAutocompleteComponent,
    NotificationBellComponent,
    NotificationsComponent,
    EventChatbotComponent,
    EditEventComponent,
    PeopleComponent,
    UserProfileComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [App]
})
export class AppModule {}
