import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { EventsListComponent } from './features/events/events-list/events-list.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { CreateEventComponent } from './features/events/create-event/create-event.component';
import { EditEventComponent } from './features/events/edit-event/edit-event.component';
import { ChatComponent } from './features/chat/chat.component';
import { ActivityFeedComponent } from './features/activity/activity-feed.component';
import { ProfileComponent } from './features/profile/profile.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { PeopleComponent } from './features/people/people.component';
import { UserProfileComponent } from './features/people/user-profile.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'events', component: EventsListComponent, data: { tab: 'discover' } },
  { path: 'events/create', component: CreateEventComponent, canActivate: [authGuard] },
  { path: 'events/:id/edit', component: EditEventComponent, canActivate: [authGuard] },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'my-events', component: EventsListComponent, canActivate: [authGuard], data: { tab: 'my-events' } },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'activity', component: ActivityFeedComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'people', component: PeopleComponent, canActivate: [authGuard] },
  { path: 'people/:userId', component: UserProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'events' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
