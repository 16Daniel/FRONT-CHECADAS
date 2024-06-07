import { CommonModule, Time } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ApiService } from '../../../Services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { Ubicacion } from '../../../Interfaces/ubicacion';
import { Empleado } from '../../../Interfaces/Empleado';
import { FormsModule } from '@angular/forms';
import { Evento } from '../../../Interfaces/Evento';
import { Calendario } from '../../../Interfaces/Calendario';


@Component({
  selector: 'app-delete-calendar',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ToastModule,
    FormsModule
  ],
  providers:[MessageService],
  templateUrl: './delete-calendar.component.html',
})
export default class DeleteCalendarComponent implements OnInit {
  public visible:boolean = false; 
  public visibleinicio:boolean = true; 
  public loading:boolean = false; 
  public resultados:boolean = false; 
public catubicaciones:Ubicacion[] = []; 
public catdepartamentos:Ubicacion[] = []; 
public catempleados:Empleado[] = []; 
public eventos:Evento[] = [];
public objcalendario:Calendario | undefined;    

public departamentosel:number | undefined; 
public empleadosel:number | undefined; 
public ubicacionsel:number | undefined; 
public horaentrada:any; 
public horasalida:any; 
public formnumdia:number | undefined; 
public formnumsemana:number | undefined;
public modo:number = 1;
public arr_horas:number[] = [0,0,0,0,0,0,0];

  constructor(public apiserv:ApiService, public cdr:ChangeDetectorRef,private messageService: MessageService)
{
  this.getUbicaciones(); 
  this.getdepartamentos(); 
}


  ngOnInit(): void { }

  add()
{

  if(this.ubicacionsel == undefined || this.ubicacionsel==null)
  {
    this.showMessage("info","Info","Favor de seleccionar una ubicación")
    return; 
  }
  if(this.horaentrada == undefined || this.horaentrada==null)
  {
    this.showMessage("info","Info","Favor de seleccionar una hora de entrada")
    return; 
  }

  if(this.horasalida == undefined || this.horasalida==null)
  {
    this.showMessage("info","Info","Favor de seleccionar una hora de salida")
    return; 
  }
  
  
  const objevento:Evento = 
  {
    idUbicacion: this.ubicacionsel!,
    nombreubicacion: this.getnameUbicacion(),
    horaEntrada: this.horaentrada,
    HoraSalida:this.horasalida,
    numdia: this.formnumdia!,
    numsemana: this.formnumsemana!

  }; 

  this.eventos.push(objevento); 
  this.ubicacionsel = undefined;
  this.horaentrada = undefined; 
  this.horasalida = undefined; 
  this.visible = false;  
}

getnameUbicacion():string
{
  console.log(this.ubicacionsel);
  const objetoFiltrado = this.catubicaciones.find(objeto => objeto.id == this.ubicacionsel);
  return objetoFiltrado!.name; 
}

getUbicaciones()
{
  this.apiserv.getUbicaciones().subscribe({
    next: data => {
       this.catubicaciones=data;
       this.cdr.detectChanges();
    },
    error: error => {
       console.log(error);
       this.showMessage('error',"Error","Error al procesar la solicitud");
    }
});
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


showMessage(sev:string,summ:string,det:string) {
  this.messageService.add({ severity: sev, summary: summ, detail: det });
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

showadd(numsemana:number,numdia:number)
{
  this.formnumdia=numdia; 
  this.formnumsemana = numsemana; 
  this.visible=true; 
}

filtrareventos(numsemana:number, numdia:number):Evento[]
{
  let objetosFiltrados = this.eventos.filter(objeto => objeto.numdia == numdia && objeto.numsemana == numsemana);
  return objetosFiltrados; 
}

save()
{
    const data = 
    {
      IdPuesto: this.departamentosel,
      IdEmpleado: this.empleadosel,
      Jdata: JSON.stringify(this.eventos)
    }
    this.apiserv.deleteCalendario(this.objcalendario!.id).subscribe(
      {
        next: data => {
          this.empleadosel = undefined; 
          this.departamentosel= undefined; 
          this.horaentrada = undefined;
          this.horasalida = undefined; 
          this.ubicacionsel = undefined; 
          this.visibleinicio = true; 
          this.loading=false; 
          this.resultados = false; 
          this.showMessage('success',"Successr","Eliminado correctamente");
       },
       error: error => {
          console.log(error);
          this.showMessage('error',"Error","Error al procesar la solicitud");
       }
      }); 
}


eliminarObjetoSeleccionado(objeto: Evento) {
  const index = this.eventos.indexOf(objeto);
  if (index !== -1) {
    this.eventos.splice(index, 1);
    this.cdr.detectChanges(); 
  }
}

getCalendario()
{
  if(this.departamentosel == undefined || this.departamentosel==null)
  {
    this.showMessage("info","Info","Favor de seleccionar un puesto de trabajo")
    return; 
  }
  
  if(this.empleadosel == undefined || this.empleadosel==null)
  {
    this.showMessage("info","Info","Favor de seleccionar un empleado")
    return; 
  }
  
  this.loading= true; 
  this.apiserv.getCalendario(this.departamentosel!,this.empleadosel!).subscribe({
    next: data => {
      debugger
      this.objcalendario = data; 
      let obj = JSON.parse(data.jdata);
      this.modo = obj.tipo; 
      if(this.modo==1)
      {
        this.eventos = obj.data;
      } else 
      {
        this.arr_horas = obj.data;
      }
       this.loading=false; 
       this.visibleinicio=false; 
       this.resultados =  true; 
       this.cdr.detectChanges();
    },
    error: error => {
      this.loading = false; 
       this.showMessage('error',"Info","No se encontraron registros");
    }
});
}


cancel()
{
  this.departamentosel = undefined;
  this.empleadosel = undefined; 
  this.loading=false; 
  this.visibleinicio=true; 
  this.resultados = false; 
  this.cdr.detectChanges();
}

}
