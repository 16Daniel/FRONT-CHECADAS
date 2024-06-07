import { Routes } from '@angular/router';

export const routes: Routes = [
    { path:'main',
    loadComponent: () => import('./main/main.component'), 
    children:
    [
        {
            path:'add-calendar',
            title:'Agregar calendario',
            loadComponent: () => import('./main/pages/add-calendar/add-calendar.component')
        },
        {
            path:'edit-calendar',
            title:'Editar calendario',
            loadComponent: () => import('./main/pages/edit-calendar/edit-calendar.component')
        },
        {
            path:'delete-calendar',
            title:'Eliminar calendario',
            loadComponent: () => import('./main/pages/delete-calendar/delete-calendar.component')
        },
        {
            path:'report-general',
            title:'Reportes',
            loadComponent: () => import('./main/pages/reportes-general/reportesGen.component')
        },
        {
            path:'report',
            title:'Reportes',
            loadComponent: () => import('./main/pages/reportes/reportes.component')
        },
        {
            path:'job-email',
            title:'Reportes',
            loadComponent: () => import('./main/pages/job-email/job-email.component')
        },
        {
            path: '',
            redirectTo: '/main/home',
            pathMatch: 'full'
        }
    ]},
    {
        path: '',
        redirectTo: '/main/',
        pathMatch: 'full'
    }
];
