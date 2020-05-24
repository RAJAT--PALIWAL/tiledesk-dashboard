import { BasetriggerComponent } from './../basetrigger/basetrigger.component';

import { NotifyService } from 'app/core/notify.service';
import { DepartmentService } from './../../services/mongodb-department.service';
import { TriggerService } from 'app/services/trigger.service';
import { Component, OnInit, trigger, ViewChild } from '@angular/core';
import * as _ from 'lodash';

// USED FOR go back last page
import { Location } from '@angular/common';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { FaqKbService } from '../../services/faq-kb.service';


@Component({
  selector: 'appdashboard-trigger-add',
  templateUrl: './trigger-add.component.html',
  styleUrls: ['./trigger-add.component.scss']
})
export class TriggerAddComponent extends BasetriggerComponent implements OnInit {
  @ViewChild('myselect') myselect; // !! Not used

  // trigger: Trigger;
  // condition: any;        --> get from BaseTriggerComponent
  // options: any;          --> get from BaseTriggerComponent
  // action: any;           --> get from BaseTriggerComponent

  conditionType = 'conditions.all';
  temp_cond: any;
  temp_act: any;
  temp_act_x_new_event: any;
  // operator: any;         --> get from BaseTriggerComponent

  triggerForm: FormGroup;
  conditions: FormArray;
  any: FormArray;
  all: FormArray;
  actions: FormArray;

  displayMODAL_Window = 'none';
  SHOW_CIRCULAR_SPINNER = false;
  SHOW_ERROR_CROSS = false;
  IS_VALID: boolean;
  errorMESSAGE: boolean;
  errorMESSAGE_server: boolean;
  submitted = false;
  loadingActions: boolean;

  selected_dept: string;


  // departments = new Array;     --> get from BaseTriggerComponent

  // messageCondition: string;    --> get from BaseTriggerComponent
  // messageAction: string;       --> get from BaseTriggerComponent
  // messageServerError: string;  --> get from BaseTriggerComponent

  constructor(
    public router: Router,
    private _location: Location,
    private formBuilder: FormBuilder,
    private triggerService: TriggerService,
    public departmentService: DepartmentService,
    private notify: NotifyService,
    public translate: TranslateService,
    public usersService: UsersService,
    public faqKbService: FaqKbService
  ) {

    super(translate, departmentService, usersService, faqKbService)
  }

  ngOnInit() {
    super.ngOnInit()

    this.triggerForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: '',
      trigger: this.formBuilder.group({
        key: ['message.received', Validators.required], // by default trigger.key is set to message.receiveed
        name: 'message create event',
      }),
      conditionALL_ANY: 'all', // by default condition dropdown is set to all
      conditions: this.formBuilder.group({
        any: this.formBuilder.array([this.createCondition()]),
        all: this.formBuilder.array([this.createCondition()]),
      }),
      actions: this.formBuilder.array([this.createAction()]),
      enabled: true // by default the stutus of trigger is set to enabled

    })

    // this.getDepartments();
    // this.selected_dept = this.getDefaultDept()  this.selected_dept 
    console.log('TRIGGER (ADD) - >>> DEFAULT DEPT ID ', this.default_dept_id);

    // because the trigger.key is set to default to message.received temp_cond filter
    // the condition in order of this key value
    this.temp_cond = this.condition.filter(b => b.triggerType === 'message.received');
    this.temp_act = this.action

    // set the initial value to action to the first element of this.action array
    const init_act = this.triggerForm.get('actions') as FormArray
    init_act.patchValue([{
      'key': this.action[0].key,
      'type': this.action[0].type,
      'placeholder': this.action[0].placeholder
    }])

    this.cleanForm();


  }


  // getDepartments() {
  //   this.departmentService.getDeptsByProjectId().subscribe((_departments: any) => {
  //     console.log('TRIGGER - GET DEPTS RESPONSE  ', _departments);

  //     _departments.forEach(dept => {
  //       if (dept.default === true) {
  //         console.log('TRIGGER - GET DEPTS RESPONSE default dept  ', dept);
  //         this.default_dept_id = dept.id
  //       }
  //     });
  //     console.log('TRIGGER - GET DEPTS - ARRAY : ', this.departments);
  //   }, error => {
  //     console.log('TRIGGER - GET DEPTS - ERROR: ', error);
  //   }, () => {

  //     console.log('TRIGGER - GET DEPTS * COMPLETE *')
  //   });
  // }

  public cleanForm() {
    //  let actions =  this.triggerForm.get('actions');
    let action_controls = this.triggerForm.get('actions')['controls'][0]
    console.log('TRIGGER ->>>>> cleanForm - TRIGGER FORM > ACTIONS CONTROLS: ', action_controls);
    let parameters_text_value = action_controls.controls['parameters'].value.text;
    action_controls.get('parameters')

    const action_parameters_text_control = action_controls.get('parameters.text')
    console.log('TRIGGER ->>>>> cleanForm - TRIGGER FORM > action_parameters_text_control: ', action_parameters_text_control);

    action_parameters_text_control.setValue(parameters_text_value.trim())
  }


  createCondition(): FormGroup {
    return this.formBuilder.group({
      fact: 'json',
      path: [undefined, Validators.required],
      operator: [undefined, Validators.required],
      value: [undefined], //, Validators.required
      type: undefined,
      key: undefined,
      placeholder: undefined
    })

  }

  createAction(): FormGroup {
    return this.formBuilder.group({
      key: [undefined, Validators.required],
      parameters: this.formBuilder.group({
        fullName: [undefined, [Validators.required]],
        text: [' ', [Validators.required]]
      }),
      type: undefined, // change value to undefined if added multiple actions next
      placeholder: undefined
    })
  }


  addConditions(): void {
    console.log('Add NEW CONDITIONS ARRAY');
    this.conditions = this.triggerForm.get(this.conditionType) as FormArray;
    this.conditions.push(this.createCondition());
  }

  removeCondition(rowIndex: number): void {
    console.log('Remove CONDITION ARRAY with index:', rowIndex);
    this.conditions = this.triggerForm.get(this.conditionType) as FormArray;
    if (this.conditions.length === 1 && rowIndex === 0) {
      this.notify.showNotification(this.messageCondition, 4, 'report_problem');
    } else {
      this.conditions.removeAt(rowIndex);
    }

  }

  addActions(): void {
    console.log('Add NEW CONDITIONS ARRAY');
    this.actions = this.triggerForm.get('actions') as FormArray;
    this.actions.push(this.createAction());
  }

  removeAction(rowIndex: number): void {
    console.log('Remove CONDITION ARRAY with index:', rowIndex);
    this.actions = this.triggerForm.get('actions') as FormArray;
    // check if exist at least 1 action to do for trigger
    if (this.actions.length === 1 && rowIndex === 0) {
      this.notify.showNotification(this.messageAction, 4, 'report_problem');
    } else {
      this.actions.removeAt(rowIndex);
    }
  }

  onEnableDisable(status: boolean) {
    console.log('trigger status:', status)
    this.triggerForm.controls['enabled'].setValue(status);
  }

  swithOnOff($event) {
    console.log('trigger status', $event.target.checked)
    this.triggerForm.controls['enabled'].setValue($event.target.checked);
  }

  // get dropdown ANY/ALL condition value
  conditionTriggerValue(value: string) {

    // this.temp_cond = this.condition;
    // this.temp_act = this.action;
    this.conditionType = 'conditions.' + value;
    console.log('Cond-value', this.conditionType);

    // reset condition formArray value: delete all the index from 1  to conditions.length and
    // finally clear the value of first index array
    this.conditions = this.triggerForm.get(this.conditionType) as FormArray;

    if (this.conditions.length !== null) {
      for (let i = 1; i < this.conditions.length; i++) {
        this.conditions.removeAt(i);
      }
      this.conditions.reset();
    } else {
      this.conditions.reset();
    }
  }

  onTriggerKey(value: string) {
    // console.log('TRIGGER (ADD) - onTriggerKey myselect', this.myselect);

    // reset condition formArray value: delete all the index from 1  to conditions.length and
    // finally clear the value of the first index array
    this.conditions = this.triggerForm.get(this.conditionType) as FormArray;

    if (this.conditions.length !== null) {
      for (let i = 1; i < this.conditions.length; i++) {
        this.conditions.removeAt(i);
      }
      this.conditions.reset();
    } else {
      this.conditions.reset();
    }

    console.log('Trigger key:', value);
    if (value) {
      this.temp_cond = this.condition.filter(b => b.triggerType === value);
    } else {
      this.temp_cond = this.condition.filter(b => b.triggerType === 'message.received');
    }


    // ------------------------------------------------------------------------------------
    // if user select NEW EVENT in run trigger the only action available is request.create
    // ------------------------------------------------------------------------------------
    if (value === 'event.emit') {

      this.actions = this.triggerForm.get('actions') as FormArray;
      console.log('TRIGGER (ADD) - onTriggerKey  this.actions', this.actions);

      if (this.actions.length !== null) {
        for (let i = 1; i < this.actions.length; i++) {
          this.actions.removeAt(i);
        }
        this.actions.reset();
      } else {
        this.actions.reset();
      }

      this.loadingActions = true;

      this.temp_act = this.action.filter(a => a.key === 'request.create');

      // !! Not used
      const items = this.myselect.items
      console.log('TRIGGER (ADD) - onTriggerKey myselect items', items);

      setTimeout(() => {
        this.loadingActions = false;
      }, 500);
    } else {
      this.temp_act = this.action
    }
    console.log('TRIGGER (ADD) - onTriggerKey value', value);
    console.log('TRIGGER (ADD) - onTriggerKey temp_cond', this.temp_cond);
    console.log('TRIGGER (ADD) - onTriggerKey temp_action', this.temp_act);
  }

  onSelectedCondition($event: any, condition: FormGroup) {
    // SEE COMMENT IN onSelectedAction
    if (
      ($event.key === 'request.lead.attributes.departmentId') ||
      ($event.key === "request.department.name") ||
      ($event.key === 'message.attributes.departmentId')
    ) {
      this.getDepartments();
    }

    // x risolvere bug Expression has changed after it was checked. Previous value: 'ng-valid: false'. Current value: 'ng-valid: true'.
    // ho tolto value required in  createCondition() e lo metto a tutti gli altri

    if (
      ($event.key !== 'request.lead.attributes.departmentId') ||
      ($event.key !== "request.department.name") ||
      ($event.key !== 'message.attributes.departmentId')
    ) {

      const value = condition.get('value')
      console.log('TRIGGER (EDIT) ->>>>> conditionsGROUP actions parameters : ', value);
      Validators.required(value)
      value.updateValueAndValidity();
    }

    this.submitted = false; // allow to reset errorMsg on screen
    console.log('VALUE', $event);

    console.log('condition before', condition)
    // set current value of selectedCondition filtering condition array by unique key : key
    // set conditionFormArray by using selectedCondition value:
    // - type , operator, key, placeholder
    const selectedCondition = this.condition.filter(b => b.key === $event.key)[0]
    console.log('TRIGGER ->>>>> onSelectedCondition - selectedCondition: ', selectedCondition);
    console.log('TRIGGER ->>>>> onSelectedCondition - selectedCondition.type: ', selectedCondition.type);
    console.log('TRIGGER ->>>>> onSelectedCondition - operator: ', this.options[selectedCondition.type + 'Opt'][0].id);

    condition.patchValue({
      'type': selectedCondition.type,
      'operator': this.options[selectedCondition.type + 'Opt'][0].id,
      'value': undefined,
      'key': selectedCondition.key,
      'placeholder': selectedCondition.placeholder
    });
    console.log('condition after', condition);

  }

  onSelectedAction(event, action) {
    console.log('onSelectedAction VALUE', event)
    console.log('action before', action);

    // For triggers for which the second action is the selection of a department, 
    // the default value is the id of the default department
    // The departments and id of the default department are obtained in the base component
    // The first selection of a trigger that involves selecting a department (for example I select Create request) 
    // works correctly but when selecting another trigger that involves selecting a department (for example Assign to department) 
    // the department id default is undefined!
    // TO FIX RE-RUN getDepartments

    if ((event === 'request.create') || (event === 'request.department.route')) {
      this.getDepartments();
    }
    // console.log('TRIGGER - onSelectedAction - default dept id  ', this.default_dept_id);

    // nk 
    // --------------------------------------------------------------------------------------------------------------------------------------------
    // Clear action parameters validators if the event is:
    // - request.department.route.self (i.e. 'Reassign to the same department')
    // - request.close (i.e. 'Close request')
    // - request.reopen (i.e. 'Reopen request') 
    // - request.participants.join (i.e. 'Participant join request')
    // - request.participants.leave (i.e. 'Participant leave request')
    // - request.department.route
    // - request.status.update
    // - request.tags.add
    // - request.department.bot.launch
    // --------------------------------------------------------------------------------------------------------------------------------------------
    if (
      (event === 'request.department.route.self') ||
      (event === 'request.close') ||
      (event === 'request.reopen') ||
      (event === 'request.participants.join') ||
      (event === 'request.participants.leave') ||
      (event === 'request.department.route') ||
      (event === 'request.status.update') ||
      (event === 'request.tags.add') ||
      (event === 'request.department.bot.launch')
    ) {
      const parameters = action.get('parameters')
      console.log('TRIGGER ->>>>> onSelectedAction - ACTIONS PARAMETER: ', parameters);

      for (const key in parameters.controls) {
        console.log('TRIGGER ->>>>> onSelectedAction - parameters.controls key: ', key);
        parameters.get(key).clearValidators();
        parameters.get(key).updateValueAndValidity();
      }
    } else {
      const parameters = action.get('parameters');

      for (const key in parameters.controls) {
        console.log('TRIGGER (ADD) ->>>>> onSelectedAction  parameters.controls key: ', key);
        parameters.get(key).setValidators([Validators.required]);
        parameters.get(key).updateValueAndValidity();
      }

    }

    // set value of second and third dropdown action section and set it's placeholder value for selected action
    action.patchValue({
      'type': this.action.filter(b => b.key === event)[0].type,
      'placeholder': this.action.filter(b => b.key === event)[0].placeholder,
      'parameters': {
        'fullName': undefined,
        'text': event === 'request.create' || event === 'message.send' ? '' : ' '
      }
    });
    console.log('action after', action);

    // if (event === 'request.create' || event === 'message.send') {
    //   this.cleanForm()
    // }
    // this.onChanges();
  }

  onChanges() {
    // action.get('parameters')
    this.triggerForm.get('actions').valueChanges.subscribe(values => {
      console.log('TRIGGER (ADD) ->>>>> onChanges  actions: ', values);
      values.forEach(val => {
        console.log('TRIGGER (ADD) ->>>>> onChanges  action: ', values);
      });
    });
  }

  get form() { return this.triggerForm.controls }

  // get text() {
  //   return this.triggerForm.get('text');
  // }

  renameKey(obj, old_key, new_key) {
    console.log('TRIGGER ->>>>> onSubmit - renameKey obj: ', obj, ' - old_key: ', old_key, ' - new_key: ', new_key);
    // check if old key = new key   
    if (old_key !== new_key) {
      Object.defineProperty(obj, new_key, // modify old key 
        Object.getOwnPropertyDescriptor(obj, old_key));  // fetch description from object 
      delete obj[old_key]; // delete old key 
    }
  }

  onSubmit() {
    
    console.log('TRIGGER ->>>>> onSubmit - get form', this.form);
    this.displayMODAL_Window = 'block';
    this.SHOW_CIRCULAR_SPINNER = true;
    this.errorMESSAGE = false;
    this.errorMESSAGE_server = false;
    this.submitted = true;


    for (let w = 0; w < this.triggerForm.value.actions.length; w++) {
      console.log('TRIGGER ->>>>> onSubmit triggerForm.value.actions[w].key: ', this.triggerForm.value.actions[w].key);

      // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // Delete the object 'parameters' from actions if the action key is:
      // - request.department.route.self (i.e. 'Reassign to the same department')
      // - request.close (i.e. 'Close request') 
      // - request.reopen (i.e. 'Reopen request') 
      // - request.department.bot.launch (i.e. 'Launch department bot') 
      // --------------------------------------------------------------------------------------------------------------------------------------------

      if (
        (this.triggerForm.value.actions[w].key === "request.department.route.self") ||
        (this.triggerForm.value.actions[w].key === 'request.close') ||
        (this.triggerForm.value.actions[w].key === 'request.reopen') ||
        (this.triggerForm.value.actions[w].key === 'request.department.bot.launch')
      ) {
        delete this.triggerForm.value.actions[w].parameters
      }

      // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // Rename the parameters key 'fullName' in 'member', delete parameter control 'text' and add the string 'bot_' if the select agent is a bot.
      // Actions key for which it is made:
      // - request.participants.join (i.e. 'Participant join request')
      // - request.participants.leave (i.e. 'Participant leave request')
      // --------------------------------------------------------------------------------------------------------------------------------------------
      if (
        (this.triggerForm.value.actions[w].key === 'request.participants.join') ||
        (this.triggerForm.value.actions[w].key === 'request.participants.leave')
      ) {
        console.log('TRIGGER ->>>>> onSubmit action key is: ', this.triggerForm.value.actions[w].key);

        // ----------------------------------------------------------------
        // search the id of the selected agent (fullnameValue) in 
        // the bots array and, if it is found, add the string 'bot_' to it
        // ----------------------------------------------------------------
        const fullnameValue = this.triggerForm.value.actions[w].parameters.fullName
        console.log('TRIGGER ->>>>> onSubmit parameters fullname value ', fullnameValue);

        let foundBot = this.bots.find(bot => bot._id === fullnameValue);
        console.log('TRIGGER ->>>>> onSubmit foundBot ', foundBot);

        if (foundBot !== undefined) {
          this.triggerForm.value.actions[w].parameters.fullName = 'bot_' + fullnameValue
        }

        // -------------------------------------------------------
        // delete the field 'text'
        // -------------------------------------------------------
        delete this.triggerForm.value.actions[w].parameters.text

        console.log('TRIGGER ->>>>> onSubmit parameters: ', this.triggerForm.value.actions[w].parameters);
        console.log('TRIGGER ->>>>> onSubmit bots: ', this.bots);

        // -------------------------------------------------------
        // Rename the key fullName in member
        // -------------------------------------------------------
        if (this.triggerForm.value.actions[w].parameters.hasOwnProperty("fullName")) {
          this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'member');
        }
      }

            // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // Rename the parameters key 'fullName' in 'sender', and add the string 'bot_' if the select agent is a bot
      // Actions key for which it is made:
      // - 'message.send' (i.e. 'Send message to visitor')
      // --------------------------------------------------------------------------------------------------------------------------------------------
      if (
        (this.triggerForm.value.actions[w].key === 'message.send') 
      ) {
        console.log('TRIGGER ->>>>> onSubmit action key is: ', this.triggerForm.value.actions[w].key);

        // ----------------------------------------------------------------
        // search the id of the selected agent (fullnameValue) in 
        // the bots array and, if it is found, add the string 'bot_' to it
        // ----------------------------------------------------------------
        const fullnameValue = this.triggerForm.value.actions[w].parameters.fullName
        console.log('TRIGGER ->>>>> onSubmit parameters fullname value ', fullnameValue);

        let foundBot = this.bots.find(bot => bot._id === fullnameValue);
        console.log('TRIGGER ->>>>> onSubmit foundBot ', foundBot);

        if (foundBot !== undefined) {
          this.triggerForm.value.actions[w].parameters.fullName = 'bot_' + fullnameValue
        }

        console.log('TRIGGER ->>>>> onSubmit parameters: ', this.triggerForm.value.actions[w].parameters);
        console.log('TRIGGER ->>>>> onSubmit bots: ', this.bots);

        // -------------------------------------------------------
        // Rename the key fullName in member
        // -------------------------------------------------------
        if (this.triggerForm.value.actions[w].parameters.hasOwnProperty("fullName")) {
          this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'sender');
        }
      }

      // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // Rename the parameters key 'fullName' in 'departmentid' and delete parameter control 'text' if the Actions key is 
      // - request.department.route (i.e. 'Assign to department')
      // Rename the parameters key 'fullName' in 'status' and delete parameter control 'text' if the Actions key is  
      // - request.status.update (i.e. 'Change request status')
      // Rename the parameters key 'fullName' in 'tag' and delete parameter control 'text' if the Actions key is  
      // - request.tags.add (i.e. 'Assign Label')
      // --------------------------------------------------------------------------------------------------------------------------------------------

      if (
        (this.triggerForm.value.actions[w].key === 'request.department.route') ||
        (this.triggerForm.value.actions[w].key === 'request.status.update') ||
        (this.triggerForm.value.actions[w].key === 'request.tags.add')
      ) {
        console.log('TRIGGER ->>>>> onSubmit action key is: ', this.triggerForm.value.actions[w].key);

        // -------------------------------------------------------
        // delete the field 'text'
        // -------------------------------------------------------
        delete this.triggerForm.value.actions[w].parameters.text

        console.log('TRIGGER ->>>>> onSubmit parameters: ', this.triggerForm.value.actions[w].parameters);

        // -------------------------------------------------------
        // Rename 
        // -------------------------------------------------------
        if (this.triggerForm.value.actions[w].parameters.hasOwnProperty("fullName")) {

          // -------------------------------------------------------
          // in departmentid if key is request.department.route
          // -------------------------------------------------------
          if (this.triggerForm.value.actions[w].key === 'request.department.route') {
            this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'departmentid');
          }

          // -------------------------------------------------------
          // in status if key is request.status.update
          // -------------------------------------------------------
          if (this.triggerForm.value.actions[w].key === 'request.status.update') {
            this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'status');
          }

          // -------------------------------------------------------
          // in tag if key is request.tags.add
          // -------------------------------------------------------
          if (this.triggerForm.value.actions[w].key === 'request.tags.add') {
            this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'tag');
          }
        }
      }

      // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // Rename the parameters key 'fullName' in 'departmentid' if the Actions key is 
      // - request.create (i.e. 'Create a request')
      // --------------------------------------------------------------------------------------------------------------------------------------------

      if (this.triggerForm.value.actions[w].key === 'request.create') {
        console.log('TRIGGER ->>>>> onSubmit action key is: ', this.triggerForm.value.actions[w].key);
        // -------------------------------------------------------
        // Rename the key fullName in departmentid
        // -------------------------------------------------------
        if (this.triggerForm.value.actions[w].parameters.hasOwnProperty("fullName")) {
          this.renameKey(this.triggerForm.value.actions[w].parameters, 'fullName', 'departmentid');
        }
      }

    }



    // delete the not choice conditionType array in triggerForm.conditions
    if (this.conditionType.split('conditions.')[1] === 'all') {
      delete this.triggerForm.value.conditions.any
    } else {
      delete this.triggerForm.value.conditions.all
    }
    // set value of all conditons.any/all.fact to 'json'
    for (let i = 0; i < this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]].length; i++) {
      this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]][i].fact = 'json'


      // nk 
      // --------------------------------------------------------------------------------------------------------------------------------------------
      // If the condition type is 'int' convert the condition value from string to number
      // --------------------------------------------------------------------------------------------------------------------------------------------
      console.log('TRIGGER ->>>>> onSubmit conditionType ', this.conditionType)
      console.log('TRIGGER ->>>>> onSubmit triggerForm.value.conditions: ', this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]][i]);

      if (this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]][i].type === 'int') {
        const conditionValue = this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]][i].value;
        console.log('TRIGGER ->>>>> onSubmit conditionValue ', conditionValue);
        this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]][i].value = parseInt(conditionValue, 10);
      }
    }

    // control validator for conditions.all/any elements
    const conditionsGROUP = this.triggerForm.get(this.conditionType) as FormGroup

    // controls name validation
    if (this.triggerForm.controls['name'].invalid) {

      setTimeout(() => {
        this.SHOW_CIRCULAR_SPINNER = false
        this.SHOW_ERROR_CROSS = true;
        this.errorMESSAGE = true;
      }, 1000);

      // check at least one action is selected
    } else if (this.triggerForm.controls['actions'].invalid) {
      console.log('action validator', this.triggerForm.controls['actions']);

      setTimeout(() => {
        this.SHOW_CIRCULAR_SPINNER = false
        this.SHOW_ERROR_CROSS = true;
        this.errorMESSAGE = true;
      }, 1000);

      // check condition validation and if first dropdawn has value than other ones has a valid value
    } else if (conditionsGROUP.invalid && conditionsGROUP.controls[0].value['path'] !== null) {

      console.log('User selected only some dropdown condition but not all. SUMBIT KO')

      setTimeout(() => {
        this.SHOW_CIRCULAR_SPINNER = false
        this.SHOW_ERROR_CROSS = true;
        this.errorMESSAGE = true;
      }, 1000);

    } else {
      // ALL FIELD IS CORRECTLY ADDED

      // add trigger.name value
      if (this.triggerForm.value.trigger.key === 'message.received') {
        this.triggerForm.value.trigger.name = 'message create event';

      } else if (this.triggerForm.value.trigger.key === 'request.create') {
        this.triggerForm.value.trigger.name = 'request create event';

      } else if (this.triggerForm.value.trigger.key === 'user.login') {
        this.triggerForm.value.trigger.name = 'user.login event';

      } else if (this.triggerForm.value.trigger.key === 'event.emit') {
        this.triggerForm.value.trigger.name = 'event emit';

      } else {
        this.triggerForm.value.trigger.name = '';
      }


      // add empty condition any or all array because server required field
      // if condition[any/all].path is null
      if (conditionsGROUP.controls[0].value['path'] === null) {
        this.triggerForm.value.conditions[this.conditionType.split('conditions.')[1]] = [];
      }
      console.log('TRIGGER ->>>>> onSubmit - TRIGGER FORM VALUE ', this.triggerForm.value);

      this.triggerService.postTrigger(this.triggerForm.value).subscribe(res => {
        console.log('add trigger response ', res);
      }, (error) => {
        setTimeout(() => {
          this.SHOW_CIRCULAR_SPINNER = false
          this.SHOW_ERROR_CROSS = true;
          this.errorMESSAGE_server = true;
        }, 1000);
        console.log('»» !!! TRIGGER -  ADD NEW TRIGGER REQUESTS  - ERROR ', error);

      }, () => {
        setTimeout(() => {
          this.SHOW_CIRCULAR_SPINNER = false;
          this.SHOW_ERROR_CROSS = false;
        }, 1000);
        console.log('»» !!! TRIGGER -  ADD NEW TRIGGER REQUESTS * COMPLETE *');

      });
    }

    console.log('TRIGGER ->>>>> TRIGGER-FORM-VALUE ', this.triggerForm.value);
  }


  // modal button CONTINUE
  onCloseModalHandled() {
    console.log('CONTINUE PRESSED ');

    if (this.errorMESSAGE || this.errorMESSAGE_server) {
      console.log('Error occured. Return to current page')
    } else {
      this._location.back();
    }
    this.displayMODAL_Window = 'none';
  }

  // modal icon X
  onCloseModal() {
    this.displayMODAL_Window = 'none';
  }

  goBack() {
    this._location.back();
  }

}
