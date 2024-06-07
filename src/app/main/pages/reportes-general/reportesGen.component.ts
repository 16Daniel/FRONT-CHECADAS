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
import { Reporte, ReporteDia, itable, reportegeneral } from '../../../Interfaces/reporte';
import { MultiSelectModule } from 'primeng/multiselect';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportesgen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    MultiSelectModule
  ],
  providers:[MessageService,DatePipe],
  templateUrl: './reportesGen.component.html',
  styles: ``,
})
export default class ReportesGenComponent implements OnInit {
  public catdepartamentos:Ubicacion[] = []; 
  public puestosseleccionados:Ubicacion[] = []; 
  public catempleados:Empleado[] = []; 
  public arr_semanas:number[] = []; 
  public arr_checadas:Checada[] = [];
  public eventos:Evento[] = []; 
  public reportegeneral:reportegeneral[] = []; 
  public reportedias:ReporteDia[] = []; 
  public tabledia:itable | undefined; 
  public diassemana:string[] = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO'];

  public departamentosel:number | undefined; 
  public empleadosel:number | undefined; 
  public semanasel:number =0;  
  public semanaselc:number =0; 
  public nombreemp:string =""; 
  public loading:boolean = false; 
  public calculado:boolean = false;
  public colores:any[] = []

  public fechainicial:Date= new Date();
  public fechafinal:Date= new Date();

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

  async getempleados(idpuesto:number):Promise<void>
{
   let puesto = this.catdepartamentos.filter(p => p.id == idpuesto);

return new Promise<void>((resolve, reject) => {
  this.apiserv.getEmpleados(idpuesto).subscribe({
    next: data => {
       for(let item of data)
       {
          this.reportegeneral.push(
            {
              idpuesto:idpuesto,
              puesto: puesto[0].name,
              idempleado:item.id,
              nombreemp:item.nombre+" "+item.apellidop+" "+item.apellidom,
              programadas:0,
              horasprogramadas:0, 
              visitas_calendarizadas:0,
              visitas_no_calendarizadas:0,
              total_visitas:0,
              total_horas:0,
              cumplimineto:0, 
              checadas:[],
              calendario:[],
              tipohoras: 1,
              color: '#fff',
              cumpliminetohoras: 0
            }
          );
       }

       resolve();
    },
    error: error => {
       console.log(error);
       this.showMessage('error',"Error","Error al procesar la solicitud");
       reject(error);
    }
});
});

}   

async consultartodo():Promise<void>
{  
  let numemcalendario = 0; 
  if(this.puestosseleccionados.length==0)
  {
    this.showMessage('info','Info','Seleccione un puesto de trabajo');
    return;
  }

  if(this.semanasel == 0)
  {
    this.showMessage('info','Info','Seleccione una semana del año');
    return;
  }
 
  this.generarColoresClaros();

  this.reportegeneral = []; 
  this.loading= true;
    for(let item of this.puestosseleccionados)
    {
       await this.getempleados(item.id); 
    }

    for(let item of this.reportegeneral)
    {
      await this.consultar(item); 
    }
    
    let primerlunes:Date = this.firstMondayOfYear(2024); 
    let fechaini:Date = primerlunes; 
   if(this.semanasel >1)
   {
      let incremento = (this.semanasel-1)*7;
      fechaini = addDays(primerlunes,incremento);
   }

   for(let item of this.reportegeneral)
    {
      this.calcular(fechaini,this.semanaselc,item); 
    }
    console.log(this.reportegeneral);
    this.loading=false;
    this.calculado = true; 
    this.cdr.detectChanges();
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

async consultar(itemreporte:reportegeneral):Promise<void>
{  
  itemreporte.color = this.getColor(itemreporte.idpuesto);
  await this.getCalendario(itemreporte); 

  return new Promise<void>((resolve, reject) => {

    let primerlunes:Date = this.firstMondayOfYear(2024); 
     let fechaini:Date = primerlunes; 
    if(this.semanasel >1)
    {
       let incremento = (this.semanasel-1)*7;
       fechaini = addDays(primerlunes,incremento);
    }
    let siguienteDomingo = addDays(fechaini,6);
    this.apiserv.getChecadas(itemreporte.idempleado,this.datePipe.transform(fechaini, 'yyyy-MM-dd')!,this.datePipe.transform(siguienteDomingo, 'yyyy-MM-dd')!).subscribe({
      next: data => {
         this.arr_checadas = data; 
         itemreporte.checadas = data;
         this.cdr.detectChanges();
         resolve(); 
      },
      error: error => {
         console.log(error);
         this.showMessage('error',"Error","Error al procesar la solicitud");
         reject(error);
      }
  });
  
  });
 
}   


calcular(lunes:Date,numsemcal:number,itemreporte:reportegeneral)
{
 
  const martes:Date = addDays(lunes,1);
  const miercoles:Date = addDays(lunes,2);
  const jueves:Date = addDays(lunes,3);
  const viernes:Date = addDays(lunes,4);
  const sabado:Date = addDays(lunes,5);
  const domingo:Date = addDays(lunes,6); 
  
  this.fechainicial = lunes;
  this.fechafinal = domingo; 

  // Utiliza map para extraer todas las ids de sucursal en un nuevo array
  let idsSucursales = this.arr_checadas.map(sucursal => sucursal.cla_reloj);
  // Utiliza Set para eliminar duplicados
  let sucursalesDistintas = new Set(idsSucursales);

  let arr_lunes = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(lunes, 'yyyy-MM-dd') );
  let arr_martes = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(martes, 'yyyy-MM-dd') );
  let arr_miercoles = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(miercoles, 'yyyy-MM-dd') );
  let arr_jueves = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(jueves, 'yyyy-MM-dd') );
  let arr_viernes = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(viernes, 'yyyy-MM-dd') );
  let arr_sabado = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(sabado, 'yyyy-MM-dd') );
  let arr_domingo = itemreporte.checadas.filter(c => this.datePipe.transform(c.fecha, 'yyyy-MM-dd') == this.datePipe.transform(domingo, 'yyyy-MM-dd') );
  
  itemreporte.programadas =0; 
  //calcular visitas candelarizadas 
  itemreporte.programadas = itemreporte.calendario.filter(v => v.numsemana == numsemcal).length;

  //// horas programadas 
  itemreporte.horasprogramadas = 0; 

  if(itemreporte.tipohoras == 1)
  {
    for(let visita of itemreporte.calendario.filter(e=> e.numsemana==numsemcal))
    { 
      let partesHora = visita.horaEntrada.split(':');
      let he = new Date(); 
      he.setHours(partesHora[0]);
      he.setMinutes(partesHora[1]);
  
      partesHora = visita.HoraSalida.split(':');
      let hs = new Date(); 
      hs.setHours(partesHora[0]);
      hs.setMinutes(partesHora[1]);
  
       let temp = this.getHourDifference(he,hs);
        itemreporte.horasprogramadas = itemreporte.horasprogramadas + temp; 
      
    }
  } else
  {
    for(let horas of itemreporte.calendario)
    {
      itemreporte.horasprogramadas = itemreporte.horasprogramadas + horas;
    }
  }
 


  // calendarizadas visitadas
  let visitadas = 0;
  itemreporte.visitas_calendarizadas = 0;
  if(itemreporte.tipohoras == 1)
  {
    debugger
    for(let item of itemreporte.calendario.filter(c=> c.numsemana == numsemcal))
    {
      if(itemreporte.checadas.filter(c => c.cla_reloj == item.idUbicacion).length > 0)
          {
            visitadas++; 
          }
    }
    
    itemreporte.visitas_calendarizadas = visitadas; 
  }

   
    let filtrados = this.eventos;
    
  // cumplimineto visitas
  if(itemreporte.programadas == 0)
    {
      itemreporte.cumplimineto  = 0; 
    } else
    {
      const cumplimiento = (100/itemreporte.programadas)* itemreporte.visitas_calendarizadas; 
      itemreporte.cumplimineto = cumplimiento; 
    }

  // no calendarizadas 
    let novisitadas = 0;

  idsSucursales = itemreporte.checadas.map(sucursal => sucursal.cla_reloj);
  sucursalesDistintas = new Set(idsSucursales);

  if(itemreporte.tipohoras == 1)
  {
    filtrados = itemreporte.calendario.filter(e=> e.numsemana==numsemcal);
    for(let item of sucursalesDistintas)
    {
        if(filtrados.filter(c => c.idUbicacion == item).length == 0)
        {
          novisitadas++; 
        }
    }

    itemreporte.visitas_no_calendarizadas = novisitadas;
  } else
  {
    itemreporte.visitas_no_calendarizadas = sucursalesDistintas.size;
  }
    

    
//// visitas totales 

  itemreporte.total_visitas = itemreporte.visitas_calendarizadas + itemreporte.visitas_no_calendarizadas; 

///// entradas y salidas 
  
// ------ lunes 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_lunes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 itemreporte.total_horas = 0; 
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_lunes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        } 
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }
 
 

 // ------ martes 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_martes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_martes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas= itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        } 
    
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }


 // ------ miercoles 
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_miercoles.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_miercoles.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        }
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }


 // ------ jueves  
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_jueves.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_jueves.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        } 
    
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }

 
 // ------ viernes
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_viernes.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_viernes.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        } 
    
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }
 }

 // ------ sabado
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_sabado.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_sabado.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
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
            itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[0].fecha,fs!);
          }
        } 
    
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }

 // ------ domingo
// Utiliza map para extraer todas las ids de sucursal en un nuevo array
idsSucursales = arr_domingo.map(sucursal => sucursal.cla_reloj);
// Utiliza Set para eliminar duplicados
 sucursalesDistintas = new Set(idsSucursales);
 for(let item of sucursalesDistintas)
 {
    let regxsuc = arr_domingo.filter(c => c.cla_reloj == item);
    if(regxsuc.length%2==0)
    {  
       for(let i=0; i<regxsuc.length; i=i+2)
       {  
        itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[i].fecha,regxsuc[i+1].fecha);
       }
    } else    
    {
      if(regxsuc.length==1)
      {
      } else
      {
        if(regxsuc.length==3)
        {
          itemreporte.total_horas = itemreporte.total_horas + this.getHourDifference(regxsuc[1].fecha,regxsuc[2].fecha);
        }
      }
    }

 }

// ------ cumplimiento horas 

itemreporte.cumpliminetohoras = 0;
if(itemreporte.horasprogramadas == 0)
{
  itemreporte.cumpliminetohoras = 0;
} else
{
  if(itemreporte.total_horas >= itemreporte.horasprogramadas)
  {
    itemreporte.cumpliminetohoras = 100;
  } else
  {
    itemreporte.cumpliminetohoras = (100/itemreporte.horasprogramadas)* itemreporte.total_horas; 
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
  if(isNaN(diffInHours))
  {return 0;}else{return diffInHours;}
}

validateTimeDifference(startDate: Date, endDate: Date): boolean {
  const diffInMs = Math.abs(startDate.getTime() - endDate.getTime());
  const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
  return diffInMinutes > 30; // Verifica si la diferencia es mayor a 30 minutos
}

async getCalendario(itemreporte:reportegeneral):Promise<void>
{
return new Promise<void>((resolve, reject) => {
  this.apiserv.getCalendario(itemreporte.idpuesto,itemreporte.idempleado).subscribe({
    next: data => {
       let obj = JSON.parse(data.jdata);
       itemreporte.tipohoras = obj.tipo; 
        itemreporte.calendario = obj.data;
       this.cdr.detectChanges();
       resolve();
    },
    error: error => {
      this.eventos = [];
      itemreporte.calendario = [];
      resolve(); 
    }
});

});
}


generarColoresClaros() {
  this.colores = [];
  for (let i = 0; i < this.puestosseleccionados.length; i++) {
    // Generar valores de componente rojo, verde y azul entre 200 y 255
    const r = Math.floor(Math.random() * 55) + 200; // Rango de 100 a 255
    const g = Math.floor(Math.random() * 55) + 200; // Rango de 100 a 255
    const b = Math.floor(Math.random() * 55) + 200; // Rango de 100 a 255
    
    // Convertir componentes a formato hexadecimal
    const colorHex = '#' + r.toString(16) + g.toString(16) + b.toString(16);
    this.colores.push({puesto : this.puestosseleccionados[i].id, color:colorHex});
  }
}

getColor(idp:number):string
{
   const color = this.colores.filter(c=> c.puesto == idp);  
   return color[0].color; 
}
  
// exportToExcel(): void {
    
//   let name = 'reporte checadas.xlsx';
// debugger
// let element = document.getElementById('reporte-tble');
// let worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

// let book: XLSX.WorkBook = XLSX.utils.book_new();
// XLSX.utils.book_append_sheet(book, worksheet, 'Sheet1');

// XLSX.writeFile(book, name);
// }

exportToExcel()
{
  const tabla = document.getElementById('reporte-tble');
  const filas = tabla!.getElementsByTagName('tr');
  const datos = [];

  for (let i = 0; i < filas.length; i++) {
    let celdas = filas[i].getElementsByTagName('td');
    if(celdas.length==0)
    {
      celdas = filas[i].getElementsByTagName('th');
    }
    const filaDatos = [];
    
    for (let j = 0; j < celdas.length; j++) {
      filaDatos.push(celdas[j].innerText);
    }
  
    filaDatos.push(this.rgbToHex(window.getComputedStyle(filas[i]).getPropertyValue('background-color')));
    datos.push(filaDatos);
  }

  let vjdata = JSON.stringify(datos);
  let data = {
    jdata:vjdata,
    fi: this.fechainicial,
    ff: this.fechafinal
  };
  this.apiserv.generarExcel(data).subscribe({
    next: data => {
      const base64String = data.base64File; // Aquí debes colocar tu cadena base64 del archivo Excel

      // Decodificar la cadena base64
      const binaryString = window.atob(base64String);
  
      // Convertir a un array de bytes
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
  
      // Crear un Blob con los datos binarios
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
      // Crear una URL para el Blob
      const url = window.URL.createObjectURL(blob);
  
      // Crear un enlace para la descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = 'REPORTE GENERAL CALENDARIOS.xlsx'; // Establecer el nombre del archivo
      document.body.appendChild(link);
  
      // Hacer clic en el enlace para iniciar la descarga
      link.click();
  
      // Limpiar la URL y el enlace después de la descarga
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    },
    error: error => {
      this.showMessage('error','Error','Error al generar el archivo de excel');
      console.log(error);
    }
});

}

rgbToHex(rgbString: string): string {
  // Convertir el color RGB a hexadecimal
  const rgbArray = rgbString.match(/\d+/g);
  if (!rgbArray) return ''; // Si no se encuentra ningún valor RGB válido, retornar cadena vacía
  const r = parseInt(rgbArray[0]);
  const g = parseInt(rgbArray[1]);
  const b = parseInt(rgbArray[2]);
  return '#' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
}

componentToHex(c: number): string {
  const hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

}
