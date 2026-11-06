import { Routes } from '@angular/router';

// Views Import
import { Landing } from './views/landing/landing';
import { Content } from './views/content/content';
import { Blog } from './views/blog/blog';
import { Store } from './views/store/store';
import { ProductViewer } from './views/store/product-viewer/product-viewer';
import { Checkout } from './views/store/checkout/checkout';
import { Team } from './views/team/team';
import { Privacy } from './views/privacy/privacy';
import { NotFound } from './views/not-found/not-found';

declare const ngDevMode: boolean;

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'blog', component: Blog },
  { path: 'blog/author/:authorName', component: Blog },
  { path: 'blog/topic/:topicName', redirectTo: 'blog' },
  { path: 'blog/:slug', component: Blog},
  { path: 'content/:contentSlug', component: Content },
  { path: 'merch', component: Store },
  { path: 'merchandise/checkout', component: NotFound },
  { path: 'merchandise/order/:orderId', component: NotFound },
  { path: 'merchandise/swag/id/:itemId', component: ProductViewer },
  { path: 'merchandise/swag/:itemSlug', component: ProductViewer },
  { path: 'heroes', component: Team },
  { path: 'privacy', component: Privacy },
  { path: 'not-found', component: NotFound },
  { path: 'home', redirectTo: '' },
  { path: 'landing', redirectTo: '' },
  { path: 'facts', redirectTo: 'blog' },
  { path: 'about', redirectTo: 'heroes' },
  { path: 'store', redirectTo: 'merch' },
  ...(typeof ngDevMode === 'undefined' || ngDevMode ? [
    { path: 'test', loadComponent: () => import('./views/testing/testing').then(m => m.Testing) },
    { path: 'debug', redirectTo: 'test' },
  ] : []),
  { path: '**', component: NotFound }
];
