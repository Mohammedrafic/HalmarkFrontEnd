import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { SetHeaderState } from 'src/app/store/app.actions';

@Component({
  selector: 'app-reports-content',
  templateUrl: './reports-content.component.html',
  styleUrls: ['./reports-content.component.scss']
})
export class ReportsContentComponent implements OnInit {

  constructor(private store: Store) {
    store.dispatch(new SetHeaderState({title: 'Reports'}));
  }

  ngOnInit(): void {
  }

}
