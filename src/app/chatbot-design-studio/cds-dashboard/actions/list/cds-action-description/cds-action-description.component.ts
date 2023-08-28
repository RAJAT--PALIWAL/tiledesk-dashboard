import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ELEMENTS_LIST } from 'app/chatbot-design-studio/utils';
import { Action } from 'app/models/intent-model';
import { LoggerService } from 'app/services/logger/logger.service';

@Component({
  selector: 'cds-action-description',
  templateUrl: './cds-action-description.component.html',
  styleUrls: ['./cds-action-description.component.scss']
})
export class CdsActionDescriptionComponent implements OnInit {

  @Input() actionSelected: Action;
  @Input() elementType: string;
  @Input() previewMode: boolean = true
  @Input() showTip: boolean = false;


  @Output() closeIntent = new EventEmitter();
  @Output() saveIntent = new EventEmitter();
  
  titlePlaceholder: string = 'Set a title';
  element: any;
  dataInput: string;

  constructor(
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    // console.log('ActionDescriptionComponent ngOnInit:: ', this.actionSelected, this.elementType);
    // if(this.elementSelected){
    //   this.elementType = TYPE_INTENT_ELEMENT.FORM;
    // } else {
    //   this.elementType = this.actionSelected._tdActionType;
    // }
    
  }

  ngOnChanges(){
    this.logger.log('ActionDescriptionComponent ngOnChanges:: ', this.actionSelected, this.elementType);
    if(this.actionSelected){
      this.elementType = this.actionSelected._tdActionType;
    }
    try {
      this.element = ELEMENTS_LIST.find(item => item.type === this.elementType);
      if(this.actionSelected._tdActionTitle && this.actionSelected._tdActionTitle != ""){
        this.dataInput = this.actionSelected._tdActionTitle;
      }
      this.logger.log('ActionDescriptionComponent action:: ', this.element);
    } catch (error) {
      this.logger.log("error ", error);
    }
  }

  onCloseIntent(){
    this.closeIntent.emit();
  }

  onSaveIntent(){
    this.saveIntent.emit();
  }

  onChangeText(text: string){
    console.log('ActionDescriptionComponent onChangeText:: ', text);
    this.actionSelected._tdActionTitle = text;
  }

}
