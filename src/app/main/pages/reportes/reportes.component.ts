import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { Ubicacion } from '../../../Interfaces/ubicacion';
import { Empleado } from '../../../Interfaces/Empleado';
import { ApiService } from '../../../Services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { addDays } from 'date-fns';
import { Checada } from '../../../Interfaces/checada';
import { DatePipe } from '@angular/common';
import { Evento } from '../../../Interfaces/Evento';
import { Reporte, ReporteDia, itable } from '../../../Interfaces/reporte';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
  ],
  providers:[MessageService,DatePipe],
  templateUrl: './reportes.component.html',
  styles: ``,
})
export default class ReportesComponent implements OnInit {
  public catdepartamentos:Ubicacion[] = []; 
  public catempleados:Empleado[] = []; 
  public arr_semanas:number[] = []; 
  public arr_checadas:Checada[] = [];
  public eventos:Evento[] = []; 
  public reporte:Reporte | undefined;
  public reportedias:ReporteDia[] = []; 
  public tabledia:itable | undefined; 
  public diassemana:string[] = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO'];

  public departamentosel:number | undefined; 
  public empleadosel:number | undefined; 
  public semanasel:number =0;  
  public nombreemp:string =""; 
  public loading:boolean = false; 
  public calculado:boolean = false;
  public semanaselc:number =0; 

  constructor(public apiserv:ApiService, public cdr:ChangeDetectorRef,private messageService: MessageService,private datePipe: DatePipe)
{
  this.getdepartamentos(); 
  
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24; // Milisegundos en un día
  const dayOfYear = Math.floor(diff / oneDay);
  let numsemanas:number = 0; 
  if((dayOfYear/7)%7==0)
  {
    numsemanas = dayOfYear/7;
  } else
  {
    numsemanas = Math.floor(dayOfYear/7);
    numsemanas++;
  }

  for(let i=1;i<=numsemanas;i++)
  {
    this.arr_semanas.push(i);
  }  
   

 for(let i=0; i<7; i++)
 {
    this.reportedias.push({
      fecha:new Date(),
      calendarizadas:0,
      calendarizadas_visitadas:0,
      visitas_no_calendarizadas:0, 
      total_visitas:0,
      cumplimiento:0, 
      horas_laboradas:0, 
      tabla:[] 
   });
 }
}


  ngOnInit(): void 
  {
    this.getdepartamentos(); 
   }

   showMessage(sev:string,summ:string,det:string) {
    this.messageService.add({ severity: sev, summary: summ, detail: det });
  }
   getdepartamentos()
   {
     this.apiserv.getDepartamentos().subscribe({
       next: data => {
          this.catdepartamentos=data;
          this.cdr.detectChanges();
       },
       error: error => {
          console.log(error);
          this.showMessage('error',"Error","Error al procesar la solicitud");
       }
   });
   } 

   semanacalendario()
{  
  this.semanaselc = 0; 
  for(let i=0; i<this.semanasel;i++)
  {
    if(this.semanaselc==4)
    {
      this.semanaselc = 1; 
    } else { this.semanaselc++; }
  }
}

   getempleados()
{

  this.apiserv.getEmpleados(this.departamentosel!).subscribe({
    next: data => {
       this.catempleados=data;
       this.cdr.detectChanges();
    },
    error: error => {
       console.log(error);
       this.showMessage('error',"Error","Error al procesar la solicitud");
    }
});

}  

firstMondayOfYear(year: number): Date {
  const firstDayOfMonth = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // Domingo es 0, Lunes es 1, ..., Sábado es 6
  let daysToAdd = 0;
  if (dayOfWeek !== 1) { // Si no es Lunes
    daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Calcular los días para llegar al primer Lunes
  }
  return new Date(year, 0, 1 + daysToAdd);
}

consultar()
{  

  let numemcalendario = 0; 
  if(this.departamentosel == undefined)
  {
    this.showMessage('info','Info','Seleccione un puesto de trabajo');
    return;
  }
  if(this.empleadosel == undefined)
  {
    this.showMessage('info','Info','Seleccione un empleado');
    return;
  }
  if(this.semanasel == 0)
  {
    this.showMessage('info','Info','Seleccione una semana del año');
    return;
  }

  this.calculado= false;
  this.loading = true; 

  //////////////////////////////////////////////////////////////////////////////
  let temp = this.catempleados.filter(e=> e.id==this.empleadosel);
  this.nombreemp = temp[0].nombre +" "+ temp[0].apellidop +" "+ temp[0].apellidom;

  for(let i=0; i<this.semanasel;i++)
  {
    if(numemcalendario==4)
    {
      numemcalendario = 1; 
    } else { numemcalendario++; }
  }

  let primerlunes:Date = this.firstMondayOfYear(2024); 
   let fechaini:Date = primerlunes; 
  if(this.semanasel >1)
  {
     let incremento = (this.semanasel-1)*7;
     fechaini = addDays(primerlunes,incremento);
  }
  let siguienteDomingo = addDays(fechaini,6);
  
  
  this.apiserv.getChecadas(this.empleadosel!,this.datePipe.transform(fechaini, 'yyyy-MM-dd')!,this.datePipe.transform(siguienteDomingo, 'yyyy-MM-dd')!).subscribe({
    next: data => {
       this.arr_checadas = data; 
       this.getCalendario(fechaini,numemcalendario); 
       this.cdr.detectChanges();
    },
    error: error => {
       console.log(error);
       this.showMessage('error',"Error","Error al procesar la solicitud");
    }
});

}   

calcular(lunes:Date,numsemcal:number)
{

  const martes:Date = addDays(lunes,1);
  const miercoles:Date = addDays(lunes,2);
  const jueves:Date = addDays(lunes,3);
  const viernes:Date = addDays(lunes,4);
  const sabado:Date = addDays(lunes,5);
  const domingo:Date = addDays(lunes,6); 

  this.reportedias[0].fecha = lunes;
  this.reportedias[1].fecha = martes;
  this.reportedias[2].fecha = miercoles;
  this.reportedias[3].fecha = jueves;
  this.reportedias[4].fecha = viernes;
  this.reportedias[5].fecha = sabado;
  this.reportedias[6].fecha = domingo;

  // Utiliza map para extraer todas las ids de sucursal en un nuevo array
  let idsSucursales = this.arr_checadas.map(sucursal => sucursal.cla_reloj);
  // Utiliza Set para eliminar duplicados
  let sucursalesDistintas = new Set(idsSucursales);

  let arr_lunes = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(lunes, 'yyyy-MM-dd') );
  let arr_martes = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(martes, 'yyyy-MM-dd') );
  let arr_miercoles = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(miercoles, 'yyyy-MM-dd') );
  let arr_jueves = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(jueves, 'yyyy-MM-dd') );
  let arr_viernes = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(viernes, 'yyyy-MM-dd') );
  let arr_sabado = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(sabado, 'yyyy-MM-dd') );
  let arr_domingo = this.arr_checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(domingo, 'yyyy-MM-dd') );

  //calcular visitas candelarizadas 
  for(let i=0;i<7;i++)
  {
    this.reportedias[i].calendarizadas = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == (i+1)).length;
  }

  // calendarizadas visitadas

    let visitadas = 0;
    let filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
    for(let item of filtrados)
    {
        if(arr_lunes.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
        {
          visitadas++; 
        }
    }
    this.reportedias[0].calendarizadas_visitadas = visitadas; 


     visitadas = 0;
     filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
    for(let item of filtrados)
    {
        if(arr_martes.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
        {
          visitadas++; 
        }
    }
    this.reportedias[1].calendarizadas_visitadas = visitadas; 

    visitadas = 0;
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
   for(let item of filtrados)
   {
       if(arr_miercoles.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
       {
         visitadas++; 
       }
   }
   this.reportedias[2].calendarizadas_visitadas = visitadas; 

   visitadas = 0;
   filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
  for(let item of filtrados)
  {
      if(arr_jueves.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
      {
        visitadas++; 
      }
  }
  this.reportedias[3].calendarizadas_visitadas = visitadas; 

  visitadas = 0;
  filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
 for(let item of filtrados)
 {
     if(arr_viernes.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
     {
       visitadas++; 
     }
 }
 this.reportedias[4].calendarizadas_visitadas = visitadas; 

 visitadas = 0;
 filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
for(let item of filtrados)
{
    if(arr_sabado.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
    {
      visitadas++; 
    }
}
this.reportedias[5].calendarizadas_visitadas = visitadas; 


visitadas = 0;
filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 7);
for(let item of filtrados)
{
   if(arr_domingo.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
   {
     visitadas++; 
   }
}
this.reportedias[6].calendarizadas_visitadas = visitadas; 



  // cumplimineto 
  for(let i=0;i<7;i++)
  { 
    if(this.reportedias[i].calendarizadas == 0)
    {
      this.reportedias[i].cumplimiento = 0; 
    } else
    {
      const cumplimiento = (100/this.reportedias[i].calendarizadas)* this.reportedias[i].calendarizadas_visitadas; 
      this.reportedias[i].cumplimiento = cumplimiento; 
    }
  }

  // no calendarizadas 
    let novisitadas = 0;

  idsSucursales = arr_lunes.map(sucursal => sucursal.cla_reloj);
  sucursalesDistintas = new Set(idsSucursales);
  console.log(sucursalesDistintas,arr_lunes); 
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[0].visitas_no_calendarizadas = novisitadas;
    

    novisitadas = 0;
    idsSucursales = arr_martes.map(sucursal => sucursal.cla_reloj);
  sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[1].visitas_no_calendarizadas = novisitadas;


    novisitadas = 0;
    idsSucursales = arr_miercoles.map(sucursal => sucursal.cla_reloj);
  sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[2].visitas_no_calendarizadas = novisitadas;

    novisitadas = 0;
    idsSucursales = arr_jueves.map(sucursal => sucursal.cla_reloj);
  sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[3].visitas_no_calendarizadas = novisitadas;

    novisitadas = 0;
    idsSucursales = arr_viernes.map(sucursal => sucursal.cla_reloj);
    sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[4].visitas_no_calendarizadas = novisitadas;

    novisitadas = 0;
    idsSucursales = arr_sabado.map(sucursal => sucursal.cla_reloj);
    sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[5].visitas_no_calendarizadas = novisitadas;

    novisitadas = 0;
    idsSucursales = arr_domingo.map(sucursal => sucursal.cla_reloj);
    sucursalesDistintas = new Set(idsSucursales);
    filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 7);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }
    this.reportedias[6].visitas_no_calendarizadas = novisitadas;
    
//// visitas totales 
for(let i=0;i<7;i++)
{ 
    const totalv= this.reportedias[i].calendarizadas_visitadas + this.reportedias[i].visitas_no_calendarizadas;
    this.reportedias[i].total_visitas = totalv; 
} 

/////// entradas y salidas 
  
// ------ lunes 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_lunes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[0].tabla = []; 
 this.reportedias[0].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_lunes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[0].horas_laboradas = this.reportedias[0].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
         this.reportedias[0].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_martes.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        { 
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });
          if(temp.length>0)
          {  
            fs = temp[temp.length-1].fecha; 
            this.reportedias[0].horas_laboradas = this.reportedias[0].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
            this.reportedias[0].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
          this.reportedias[0].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[0].horas_laboradas = this.reportedias[0].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 1);
          this.reportedias[0].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }
 
 

 // ------ martes 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_martes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[1].tabla = []; 
 this.reportedias[1].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_martes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[1].horas_laboradas = this.reportedias[1].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
         this.reportedias[1].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_miercoles.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        { 
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });
          if(temp.length>0)
          {  
            fs = temp[temp.length-1].fecha; 
            this.reportedias[1].horas_laboradas = this.reportedias[1].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
            this.reportedias[1].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
          this.reportedias[1].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[1].horas_laboradas = this.reportedias[1].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 2);
          this.reportedias[1].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }


 // ------ miercoles 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_miercoles.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[2].tabla = []; 
 this.reportedias[2].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_miercoles.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[2].horas_laboradas = this.reportedias[2].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
         this.reportedias[2].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_jueves.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        {
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });
          if(temp.length>0)
          {
            fs = temp[temp.length-1].fecha; 
            this.reportedias[2].horas_laboradas = this.reportedias[2].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
            this.reportedias[2].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
          this.reportedias[2].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[2].horas_laboradas = this.reportedias[2].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 3);
          this.reportedias[2].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }


 // ------ jueves  
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_jueves.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[3].tabla = []; 
 this.reportedias[3].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_jueves.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[3].horas_laboradas = this.reportedias[3].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
         this.reportedias[3].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_viernes.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        {
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });
          if(temp.length>0)
          {
            fs = temp[temp.length-1].fecha; 
            this.reportedias[3].horas_laboradas = this.reportedias[3].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
            this.reportedias[3].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
          this.reportedias[3].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[3].horas_laboradas = this.reportedias[3].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 4);
          this.reportedias[3].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }

 
 // ------ viernes
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_viernes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[4].tabla = []; 
 this.reportedias[4].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_viernes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[4].horas_laboradas = this.reportedias[4].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
         this.reportedias[4].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_sabado.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        {  
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });

          if(temp.length>0)
          {
            fs = temp[temp.length-1].fecha; 
            this.reportedias[4].horas_laboradas = this.reportedias[4].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
            this.reportedias[4].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
          this.reportedias[4].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[4].horas_laboradas = this.reportedias[4].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 5);
          this.reportedias[4].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }
 }

 // ------ sabado
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_sabado.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[5].tabla = []; 
 this.reportedias[5].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_sabado.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[5].horas_laboradas = this.reportedias[5].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
         this.reportedias[5].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
        let fs:Date | undefined = undefined; 
        let regxsuc2 = arr_domingo.filter(c => c.cla_reloj == item);
        if(regxsuc2.length>0)
        {
          let temp = regxsuc2.filter(objeto => {
            // Obtenemos la hora de la fecha actual del objeto
            const hora = new Date(objeto.fecha)
            // Filtramos los objetos cuya hora sea menor a las 4 AM
            return hora.getHours() < 4;
          });
          if(temp.length>0)
          {
            fs = temp[temp.length-1].fecha; 
            this.reportedias[5].horas_laboradas = this.reportedias[5].horas_laboradas + this.getHourDifference(regxsuc[0].fecha,fs!);
            filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
            this.reportedias[5].tabla.push
            (
             {
               sucursal: regxsuc[0].nom_reloj,
               entrada: regxsuc[0].fecha,
               salida: fs,
               estadia:this.getHourDifference(regxsuc[0].fecha,fs!),
               estatusC:'COMPLETA',
               estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
             }
            );

          }
        } else
        {

          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
          this.reportedias[5].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );

        }
    
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[5].horas_laboradas = this.reportedias[5].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 6);
          this.reportedias[5].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }

 // ------ domingo
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_domingo.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 this.reportedias[6].tabla = []; 
 this.reportedias[6].horas_laboradas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_domingo.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        this.reportedias[6].horas_laboradas = this.reportedias[6].horas_laboradas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
        filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 7);
         this.reportedias[6].tabla.push
         (
          {
            sucursal: regxsuc[i].nom_reloj,
            entrada: regxsuc[i].fecha,
            salida: regxsuc[i+1].fecha,
            estadia: this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha),
            estatusC:'COMPLETA',
            estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[i].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
          }
         );
       }
    } else    
    {
      if(regxsuc.length==1)
      {
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 7);
          this.reportedias[6].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[0].fecha,
             salida:undefined,
             estadia:undefined,
             estatusC:'INCOMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
      } else
      {
        if(regxsuc.length==3)
        {
          this.reportedias[6].horas_laboradas = this.reportedias[6].horas_laboradas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
          filtrados = this.eventos.filter(e=> e.numsemana==numsemcal && e.numdia == 7);
          this.reportedias[6].tabla.push
          (
           {
             sucursal: regxsuc[0].nom_reloj,
             entrada: regxsuc[1].fecha,
             salida: regxsuc[2].fecha,
             estadia:this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha),
             estatusC:'COMPLETA',
             estatusV: filtrados.filter(v => v.idUbicacion == regxsuc[0].cla_reloj).length == 0 ? 'NO CALENDARIZADA': 'CALENDARIZADA'
           }
          );
        }
      }
    }

 }

 this.calculado= true;
  this.loading = false; 
  this.cdr.detectChanges();
} 

getHourDifference(startDate: Date, endDate: Date): number {
  let hi:Date = new Date(startDate);
  let hf:Date = new Date(endDate);
  const diffInMs = hf.getTime() - hi.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return diffInHours;
}

validateTimeDifference(startDate: Date, endDate: Date): boolean {
  const diffInMs = Math.abs(startDate.getTime() - endDate.getTime());
  const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
  return diffInMinutes > 30; // Verifica si la diferencia es mayor a 30 minutos
}

getCalendario(fechaini:Date,numsemcal:number)
{
  this.apiserv.getCalendario(this.departamentosel!,this.empleadosel!).subscribe({
    next: data => {
      let obj = JSON.parse(data.jdata);
      if(obj.tipo == 1)
      {
        this.eventos = obj.data;
      } else
      {
        this.eventos = []; 
      }
       this.calcular(fechaini,numsemcal); 
       this.cdr.detectChanges();
    },
    error: error => {
      this.eventos = [];
      this.calcular(fechaini,numsemcal); 
    }
});
}

  

}
