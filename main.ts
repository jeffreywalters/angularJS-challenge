"use strict";

// import * as $ from "jquery";
// import * as angular from "angular";
// import * as ngResource from "angular-resource";
// import * as uiRouter from "angular-ui-router";
// import * as angularSpinner from "angular-spinner";

type ACRequest = {
  id: number,
  title: string,
  updated_at: string,
  created_at: string,
  status: string,
  options: any
}

angular.module("challenge", [
  "ngResource",
  "angularSpinner",
  "ui.router",
  "ui.bootstrap"
]);

function routes($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {
  $stateProvider
    .state("list", {
      url: "/",
      template: "<request-list></request-list>"
    })
    .state("edit", {
      url: "/edit/:id",
      template: "<edit-form></edit-form>"
    })
    .state("add", {
      url: "/add",
      template: "<add-form></add-form>"
    });
  $urlRouterProvider.otherwise("/");
}
angular.module('challenge').config(routes);

(function () {

  MyRequest.$inject = ['$resource'];
  function MyRequest($resource: ng.resource.IResourceService) {
    return $resource(
      "/requests.json",
      null,
      {
        get: { method: "GET", isArray: true },
        save: { method: "POST" },
        query: { method: "GET", isArray: true },
        remove: { method: "DELETE" },
        delete: { method: "DELETE" },
        update: { method: "PUT" }
      }
    );
  }
  angular.module('challenge').factory("MyRequest", MyRequest);

})()


interface IRequestsController {
  search: string,
  order: string,
  requests: any,
  selectRequest: ($event: JQueryMouseEventObject, request: ACRequest) => void,
  sensitiveSearch: (request: ACRequest) => boolean,
  deleteRequest: (id: number) => void
}

class RequestsController implements IRequestsController {
  search: string = '';
  order: string = 'title';
  requests: any;
  selectRequest: ($event: JQueryMouseEventObject, request: ACRequest) => void = ($event, request) => {
    this.requests.selectedRequest = request;
    if (angular.element($event.target).data('status')) {
      console.log(angular.element($event.target).data('status'));
      request.status = angular.element($event.target).data('status');
      request.updated_at = (new Date()).toISOString();
    }
  };
  sensitiveSearch: (request: ACRequest) => boolean = (request) => {
    if (this.search) {
      return (
        request.title.toLowerCase().indexOf(this.search.toLowerCase()) > -1 ||
        request.status.toLowerCase().indexOf(this.search.toLowerCase()) > -1
      );
    }
    return true;
  };
  deleteRequest: (id: number) => void = (id) => {
    $('.bs-confirm-modal').modal({});
    const dlt = () => {
      $timeout(() => { this.requests.deleteRequest(id); });
      $('.bs-confirm-modal').modal('hide');
    }
    function removeClick() {
      $('#deleteButton').off('click', dlt);
      $('.bs-confirm-modal').off('hide.bs.modal', removeClick);
    }
    $('#deleteButton').on('click', dlt);
    $('.bs-confirm-modal').on('hide.bs.modal', removeClick);
  };

  static $inject = ["requestService", "$timeout"];

  constructor(requestService: any, $timeout: ng.ITimeoutService) {
    const self = this;
    self.requests = requestService;
    self.requests.loadRequests().then(() => {
      console.log("loaded");
    });
  }
}

angular.module('challenge').controller("RequestsController", RequestsController);


(function (angular) {

  interface IEditRequestController {
    request: ACRequest,
    request2Edit: ACRequest,
    requests: any,
    save(): void,
    reset(): void
  }

  class EditRequestController implements IEditRequestController {
    private $state: ng.ui.IStateService;
    request: ACRequest;
    request2Edit: ACRequest;
    requests: any;

    static $inject = ["requestService", "$stateParams", "$state"];

    constructor(requestService, $stateParams: ng.ui.IStateParamsService, $state: ng.ui.IStateService) {
      const self = this;
      this.$state = $state;
      this.requests = requestService;
      this.requests.loadRequests().then((): void => {
        self.request2Edit = self.requests.getRequest($stateParams.id);
        self.request = angular.extend({}, self.request2Edit);
      });
    }

    save: () => void = () => {
      this.request2Edit.title = this.request.title;
      this.request2Edit.status = this.request.status;
      this.request2Edit.updated_at = (new Date()).toISOString();
      this.$state.go('list');
    }

    reset: () => void = () => {
      this.request = angular.extend({}, this.request2Edit);
    }
  }

  angular.module('challenge').controller("EditRequestController", EditRequestController);




  class addRequestController implements IEditRequestController {
    private $state: ng.ui.IStateService;
    request: ACRequest;
    request2Edit: ACRequest;
    requests: any;

    static $inject = ["requestService", "$stateParams", "$state"];

    constructor(requestService, $stateParams: ng.ui.IStateParamsService, $state: ng.ui.IStateService) {
      const self = this;
      this.$state = $state;
      this.requests = requestService;
      this.requests.loadRequests().then((): void => {
        self.request = {
          id: this.requests.index + 1,
          title: '',
          updated_at: (new Date()).toISOString(),
          created_at: (new Date()).toISOString(),
          status: 'Pending',
          options: []
        };
      });
    }

    save: () => void = () => {
      this.requests.addRequest(this.request);
      this.$state.go('list');
    }

    reset: () => void = () => {
      this.request = {
        id: this.requests.index + 1,
        title: '',
        updated_at: (new Date()).toISOString(),
        created_at: (new Date()).toISOString(),
        status: '',
        options: []
      };
    }
  }

  angular.module('challenge').controller('addRequestController', addRequestController);


  function requestList(): ng.IDirective {
    const directive = <ng.IDirective>{
      restrict: 'E',
      templateUrl: "templates/list.html",
      controller: "RequestsController",
      controllerAs: "ctrl",
      scope: {}
    };

    return directive;
  }

  angular.module('challenge').directive('requestList', requestList);

  function editForm(): ng.IDirective {
    const directive = <ng.IDirective>{
      restrict: 'E',
      scope: {},
      templateUrl: "templates/request_form.html",
      controller: "EditRequestController",
      controllerAs: "ctrl"
    }

    return directive;
  }

  angular.module('challenge').directive('editForm', editForm);


  function addForm(): ng.IDirective {
    const directive = <ng.IDirective>{
      restrict: 'E',
      scope: {},
      templateUrl: "templates/request_form.html",
      controller: "addRequestController",
      controllerAs: "ctrl"
    };

    return directive;
  }

  angular.module('challenge').directive('addForm', addForm);

})(angular);



class RequestService {
  private $sce: ng.ISCEService;
  private $q: ng.IQService;
  isLoading: boolean = false;
  selectedRequest: ACRequest | null = null;
  data: ACRequest[] = [];
  MyRequest: any;
  index: number;

  constructor(MyRequest, $q: ng.IQService, $sce: ng.ISCEService) {
    this.MyRequest = MyRequest;
    this.$q = $q;
    this.$sce = $sce;
    this.index = 0;
  }

  addRequest: (request: ACRequest) => void = (request: ACRequest): void => {
    if (this.index < Number(request.id)) this.index = Number(request.id);
    this.data.push(request);
  }

  deleteRequest: (id: number) => void = (id): void => {
    this.data = this.data.filter((request: ACRequest) => {
      return request.id != id;
    });
  }

  getRequest: (id: number) => ACRequest | {} = (id) => {
    for (var i = 0; i < this.data.length; i++) {
      var obj: ACRequest = this.data[i];
      if (obj.id == id) {
        return obj;
      }
    }
    return {};
  }

  loadRequests: (force: boolean) => ng.IPromise<ACRequest> = (force = false) => {
    var d = this.$q.defer<ACRequest>();
    if (!force && this.data.length) {
      d.resolve();
      return d.promise;
    }
    this.isLoading = true;
    // simulate fetch delay
    setTimeout(
      () =>
        this.MyRequest.get((data: ACRequest[]) => {
          angular.forEach(data, (request: ACRequest) => {
            request.options = this.getOptions(request);
            if (this.index < Number(request.id)) this.index = Number(request.id);
            this.data.push(new this.MyRequest(request));
          });
          this.isLoading = false;
          d.resolve();
        }),
      1200
    );
    return d.promise;
  };
  // for popover menu to change status
  getOptions: (request: ACRequest) => any = (request) => {
    const options = ["Approved", "Pending", "Denied"]
      .filter(it => it !== request.status)
      .reduce(
      (acc, item) => acc += `<div><a data-status="${item}" onclick="console.log('${request.id} ${item}')">${item}</a></div>`,
      ""
      );
    return this.$sce.trustAsHtml(options);
  }

}

angular.module('challenge').service("requestService", RequestService);


angular.module('challenge').directive("customValidation", customValidation);

function customValidation(): ng.IDirective {
  const directive = <ng.IDirective>{
    require: "ngModel",
    link: link
  };

  function link(scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes, modelCtrl: ng.INgModelController): void {
    modelCtrl.$parsers.push(function (inputValue) {
      var transformedInput = inputValue.toLowerCase().replace(/ /g, "");

      if (transformedInput != inputValue) {
        modelCtrl.$setViewValue(transformedInput);
        modelCtrl.$render();
      }

      return transformedInput;
    });
  }

  return directive;
}


((): void => {
  'use strict';

  // NOT Used!
  //directive handles native bootstrap popover; I've made the switch to ui.bootstrap
  angular.module('challenge').directive('bsPopover', bsPopover);

  function bsPopover(): ng.IDirective {
    const directive = <ng.IDirective>{
      restrict: 'A',
      scope: {},
      link: link
    };

    function link(scope: ng.IScope, element: ng.IAugmentedJQuery): void {
      element
        .find('button[rel="popover"]')
        .popover({ placement: "right", html: "true" })
        .on("click", (e: JQueryMouseEventObject) => {
          e.preventDefault(); // hide all other popovers
          angular.element("[rel=popover]").not(e.target).popover("hide");
          // $(".popover").remove();
        });
    }

    return directive;
  }
})();



((): void => {
  'use strict';

  angular.module('challenge').directive('bsField', bsField);

  function bsField(): ng.IDirective {
    const directive = <ng.IDirective>{
      restrict: 'E',
      scope: {
        value: '=',
        name: '@',
        type: '@',
        label: '@'
      },
      replace: false,
      controller: function () { },
      controllerAs: 'ctrl',
      bindToController: true,
      require: '^form',
      link: (scope: ng.IScope, elem: ng.IAugmentedJQuery, attr: ng.IAttributes, formCtrl: any) => {
        if (attr.required !== undefined) {// If attribute required exists
          scope.ctrl.required = true;
        }
        if (attr.disabled !== undefined) {// If attribute required exists
          scope.ctrl.disabled = true;
        }
        scope.ctrl.form = formCtrl;
      },
      transclude: true,
      template: `
      <div ng-class="{
        'form-group': true,
        'has-error': ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid,
        'has-feedback': ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid
      }">
        <label htmlFor="{{ctrl.name}}" class="col-sm-2 control-label"> {{ ctrl.label }} </label>
        <div class="col-sm-9" ng-switch="ctrl.type">
          <select ng-switch-when="select" name="{{ctrl.name}}" id="{{ctrl.name}}" ng-model="ctrl.value" ng-disabled="ctrl.disabled" class="form-control" ng-required="ctrl.required" ng-transclude></select>

          <input ng-switch-default type="{{ctrl.type || 'text'}}" name="{{ctrl.name}}" id="{{ctrl.name}}" ng-model="ctrl.value" ng-disabled="ctrl.disabled" class='form-control' ng-required="ctrl.required" />

          <span ng-if="ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid" class="glyphicon glyphicon-remove form-control-feedback"></span>
          
          <div ng-if="ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$error.required" class='text-danger bg-warning' style="padding: 2; marginBottom: 0;">
            &nbsp;
            <span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>
            Required!
          </div>
        </div>
      </div>`
    }

    return directive;
  }


  angular.module('challenge').filter('replaceUnderscores', function () {
    return function (input) {
      return (!!input) ? input.replace('_', ' ') : '';
    }
  });

})()