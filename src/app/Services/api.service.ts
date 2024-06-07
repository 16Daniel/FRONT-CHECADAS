import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { environment } from '../../environments/enviroments';
import { Ubicacion } from '../Interfaces/ubicacion';
import { Empleado, EmpleadoEmail } from '../Interfaces/Empleado';
import { Calendario } from '../Interfaces/Calendario';
import { Checada } from '../Interfaces/checada';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL to web api
  public apiURL = environment.apiURL;
  // URL api server
  private url: string = environment.apiURL;
  private headers = new HttpHeaders();

  constructor(private http: HttpClient) 
  {
    this.headers.append("Accept", "application/json");
    this.headers.append("content-type", "application/json");
   }

   getUbicaciones():Observable<Ubicacion[]>
   {
      return this.http.get<Ubicacion[]>(this.url+'Checadas/getUbicaciones',{headers:this.headers})
   }

   getDepartamentos():Observable<Ubicacion[]>
   {
      return this.http.get<Ubicacion[]>(this.url+'Checadas/getDepartamentos',{headers:this.headers})
   }

   getEmpleados(id:number):Observable<Empleado[]>
   {
      return this.http.get<Empleado[]>(this.url+'Checadas/getEmpleados/'+id,{headers:this.headers})
   }

   saveCalendario(data:any):Observable<any>
   {
      return this.http.post<any>(this.url+'Checadas/saveCalendariosChecadas',data,{headers:this.headers})
   }

   getCalendario(idp:number, idemp:number):Observable<Calendario>
   {
      return this.http.get<Calendario>(this.url+'Checadas/getCalendarioChecada/'+idp+"/"+idemp,{headers:this.headers})
   }

   deleteCalendario(id:number):Observable<any>
   {
      return this.http.delete<any>(this.url+`Checadas/deleteCalendarioChecadas/${id}`,{headers:this.headers})
   }

   getChecadas(idemp:number, fi:string, ff:string):Observable<Checada[]>
   {
 
      return this.http.get<Checada[]>(this.url+'Checadas/getCatStatusChecadas/'+idemp+"/"+fi +"/"+ff,{headers:this.headers})
   }

   
   generarExcel(data:any):Observable<any>
   {
      return this.http.post<any>(this.url+'Checadas/generateExcel',data,{headers:this.headers})
   }

   getEmpleadosEmail():Observable<EmpleadoEmail[]>
   {
      return this.http.get<EmpleadoEmail[]>(this.url+'Checadas/getEmpleadosEmail',{headers:this.headers})
   }

}

