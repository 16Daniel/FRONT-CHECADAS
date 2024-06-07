import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent 
{

ngOnInit(): void {

  const home = document.querySelector('#home');
  const body = document.querySelector('body'),
  sidebar = body!.querySelector('nav'),
  toggle = body!.querySelector(".toggle"),
  modeSwitch = body!.querySelector(".toggle-switch"),
  modeText = body!.querySelector(".mode-text");
toggle!.addEventListener("click" , () =>{
sidebar!.classList.toggle("close");
home!.classList.toggle("expanded"); 
})

modeSwitch!.addEventListener("click" , () =>{
body!.classList.toggle("dark");

if(body!.classList.contains("dark")){
   // modeText!.innerText = "Light mode";
   modeText!.innerHTML ="Light mode"
}else{
  //  modeText!.innerText = "Dark mode";
  modeText!.innerHTML ="Dark mode"
    
}
});
  
}
 }
