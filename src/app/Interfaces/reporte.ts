import { Checada } from "./checada";
import { Evento } from "./Evento";

export interface Reporte 
{
    nombre:string;
    calendarizadas:number;
    calendarizadas_visitadas:number;
    visitas_no_calendarizadas:number; 
    total_visitas:number;
    cumplimiento:number; 
    horas_laboradas:number; 
    lunes:ReporteDia;
    martes:ReporteDia;
    miercoles:ReporteDia; 
    jueves:ReporteDia;
    viernes:ReporteDia;
    sabado:ReporteDia;
    domingo:ReporteDia;
 }

 export interface ReporteDia
 {  
      fecha:Date;
    calendarizadas:number;
    calendarizadas_visitadas:number;
    visitas_no_calendarizadas:number; 
    total_visitas:number;
    cumplimiento:number; 
    horas_laboradas:number; 
    tabla:itable[]; 
 }

 
 export interface itable
 {
    sucursal:string;
    entrada:any;
    salida:any;
    estadia:any;
    estatusC:string;
    estatusV:string; 
 }

 
 export interface reportegeneral
 {
   idpuesto:number;
   puesto:string;
   idempleado:number;
   nombreemp:string;
   programadas:number;
   horasprogramadas:number; 
   visitas_calendarizadas:number;
   visitas_no_calendarizadas:number;
   total_visitas:number;
   total_horas:number;
   cumplimineto:number; 
   checadas:Checada[];
   calendario:any[];
   tipohoras:number; 
   color:string; 
   cumpliminetohoras:number;
 }
 
