import { Component, Injector, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ITask } from './itask';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = signal('todo-app');
  welcome = signal('Bienvenido a mi primera aplicación con Angular');
  tasks = signal<ITask[]>([
    ]);

  newTaskCtrl = new FormControl('',{
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)]
  });
  
  filter = signal<'all' | 'pending' | 'completed'>('all');

  tasksByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();
    if (filter === 'pending') {
      return tasks.filter(task => !task.completed);
    }
    if (filter === 'completed') {
      return tasks.filter(task => task.completed);
    }
    return tasks;
  });

  tasksCompleted = computed(() => {
    const tasks = this.tasksByFilter();

    return  tasks.filter(task => !task.completed).length;
  });

  
  injector = inject(Injector);

  ngOnInit() {
    const storage = localStorage.getItem('tasks');
    if (storage) {
      const tasks = JSON.parse(storage);
      this.tasks.set(tasks);
    }
    this.trackTasks();
  }

  trackTasks() {
    effect(() => {
      const tasks = this.tasks();
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }, { injector: this.injector });
  }

  addTask(){
    if (this.newTaskCtrl.invalid) return;
    const val = this.newTaskCtrl.value
    
    this.tasks.update(tasks=>{
     const maxId = tasks.reduce((max, task) => (task.id > max ? task.id : max), 0)
     const newId = maxId + 1;
     const newTask: ITask = {
              id: newId,
              title: val,
              completed: false,
              editing: false
            };
      return [...tasks, newTask];
    });
    this.newTaskCtrl.reset();
  }
  deleteTask(id: number){
    this.tasks.update(tasks => tasks.filter(task => task.id !== id));
  }
  updateCompleteTask(task: ITask){
    task.completed = !task.completed;
    this.tasks.update(tasks => tasks.map(t => t.id === task.id ? task : t));
  }
  updateEditingTask(task: ITask){
    if(task.completed)return;
    task.editing = true;
    this.tasks.update(tasks => tasks.map(t => 
      {
        if(t.id === task.id){
          task.editing
          return task;
        }
        
        t.editing = false;
        return t;
      }));
  }
  updateTitleTask(task: ITask, event: Event){
    const input = event.target as HTMLInputElement;
    task.title = input.value.trim();
    task.editing = false;
    this.tasks.update(tasks => tasks.map(t => t.id === task.id ? task : t));
  }
  changeFilter(filter: 'all' | 'pending' | 'completed') {
    this.filter.set(filter);
  }
}
