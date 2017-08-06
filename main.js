"use strict";
angular.module("challenge", [
    "ngResource",
    "angularSpinner",
    "ui.router",
    "ui.bootstrap"
]);
function routes($stateProvider, $urlRouterProvider) {
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
    function MyRequest($resource) {
        return $resource("/requests.json", null, {
            get: { method: "GET", isArray: true },
            save: { method: "POST" },
            query: { method: "GET", isArray: true },
            remove: { method: "DELETE" },
            delete: { method: "DELETE" },
            update: { method: "PUT" }
        });
    }
    angular.module('challenge').factory("MyRequest", MyRequest);
})();
var RequestsController = (function () {
    function RequestsController(requestService, $timeout) {
        var _this = this;
        this.search = '';
        this.order = 'title';
        this.selectRequest = function ($event, request) {
            _this.requests.selectedRequest = request;
            if (angular.element($event.target).data('status')) {
                console.log(angular.element($event.target).data('status'));
                request.status = angular.element($event.target).data('status');
                request.updated_at = (new Date()).toISOString();
            }
        };
        this.sensitiveSearch = function (request) {
            if (_this.search) {
                return (request.title.toLowerCase().indexOf(_this.search.toLowerCase()) > -1 ||
                    request.status.toLowerCase().indexOf(_this.search.toLowerCase()) > -1);
            }
            return true;
        };
        this.deleteRequest = function (id) {
            $('.bs-confirm-modal').modal({});
            var dlt = function () {
                $timeout(function () { _this.requests.deleteRequest(id); });
                $('.bs-confirm-modal').modal('hide');
            };
            function removeClick() {
                $('#deleteButton').off('click', dlt);
                $('.bs-confirm-modal').off('hide.bs.modal', removeClick);
            }
            $('#deleteButton').on('click', dlt);
            $('.bs-confirm-modal').on('hide.bs.modal', removeClick);
        };
        var self = this;
        self.requests = requestService;
        self.requests.loadRequests().then(function () {
            console.log("loaded");
        });
    }
    return RequestsController;
}());
RequestsController.$inject = ["requestService", "$timeout"];
angular.module('challenge').controller("RequestsController", RequestsController);
(function (angular) {
    var EditRequestController = (function () {
        function EditRequestController(requestService, $stateParams, $state) {
            var _this = this;
            this.save = function () {
                _this.request2Edit.title = _this.request.title;
                _this.request2Edit.status = _this.request.status;
                _this.request2Edit.updated_at = (new Date()).toISOString();
                _this.$state.go('list');
            };
            this.reset = function () {
                _this.request = angular.extend({}, _this.request2Edit);
            };
            var self = this;
            this.$state = $state;
            this.requests = requestService;
            this.requests.loadRequests().then(function () {
                self.request2Edit = self.requests.getRequest($stateParams.id);
                self.request = angular.extend({}, self.request2Edit);
            });
        }
        return EditRequestController;
    }());
    EditRequestController.$inject = ["requestService", "$stateParams", "$state"];
    angular.module('challenge').controller("EditRequestController", EditRequestController);
    var addRequestController = (function () {
        function addRequestController(requestService, $stateParams, $state) {
            var _this = this;
            this.save = function () {
                _this.requests.addRequest(_this.request);
                _this.$state.go('list');
            };
            this.reset = function () {
                _this.request = {
                    id: _this.requests.index + 1,
                    title: '',
                    updated_at: (new Date()).toISOString(),
                    created_at: (new Date()).toISOString(),
                    status: '',
                    options: []
                };
            };
            var self = this;
            this.$state = $state;
            this.requests = requestService;
            this.requests.loadRequests().then(function () {
                self.request = {
                    id: _this.requests.index + 1,
                    title: '',
                    updated_at: (new Date()).toISOString(),
                    created_at: (new Date()).toISOString(),
                    status: 'Pending',
                    options: []
                };
            });
        }
        return addRequestController;
    }());
    addRequestController.$inject = ["requestService", "$stateParams", "$state"];
    angular.module('challenge').controller('addRequestController', addRequestController);
    function requestList() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/list.html",
            controller: "RequestsController",
            controllerAs: "ctrl",
            scope: {}
        };
        return directive;
    }
    angular.module('challenge').directive('requestList', requestList);
    function editForm() {
        var directive = {
            restrict: 'E',
            scope: {},
            templateUrl: "templates/request_form.html",
            controller: "EditRequestController",
            controllerAs: "ctrl"
        };
        return directive;
    }
    angular.module('challenge').directive('editForm', editForm);
    function addForm() {
        var directive = {
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
var RequestService = (function () {
    function RequestService(MyRequest, $q, $sce) {
        var _this = this;
        this.isLoading = false;
        this.selectedRequest = null;
        this.data = [];
        this.addRequest = function (request) {
            if (_this.index < Number(request.id))
                _this.index = Number(request.id);
            _this.data.push(request);
        };
        this.deleteRequest = function (id) {
            _this.data = _this.data.filter(function (request) {
                return request.id != id;
            });
        };
        this.getRequest = function (id) {
            for (var i = 0; i < _this.data.length; i++) {
                var obj = _this.data[i];
                if (obj.id == id) {
                    return obj;
                }
            }
            return {};
        };
        this.loadRequests = function (force) {
            if (force === void 0) { force = false; }
            var d = _this.$q.defer();
            if (!force && _this.data.length) {
                d.resolve();
                return d.promise;
            }
            _this.isLoading = true;
            // simulate fetch delay
            setTimeout(function () {
                return _this.MyRequest.get(function (data) {
                    angular.forEach(data, function (request) {
                        request.options = _this.getOptions(request);
                        if (_this.index < Number(request.id))
                            _this.index = Number(request.id);
                        _this.data.push(new _this.MyRequest(request));
                    });
                    _this.isLoading = false;
                    d.resolve();
                });
            }, 1200);
            return d.promise;
        };
        // for popover menu to change status
        this.getOptions = function (request) {
            var options = ["Approved", "Pending", "Denied"]
                .filter(function (it) { return it !== request.status; })
                .reduce(function (acc, item) { return acc += "<div><a data-status=\"" + item + "\" onclick=\"console.log('" + request.id + " " + item + "')\">" + item + "</a></div>"; }, "");
            return _this.$sce.trustAsHtml(options);
        };
        this.MyRequest = MyRequest;
        this.$q = $q;
        this.$sce = $sce;
        this.index = 0;
    }
    return RequestService;
}());
angular.module('challenge').service("requestService", RequestService);
angular.module('challenge').directive("customValidation", customValidation);
function customValidation() {
    var directive = {
        require: "ngModel",
        link: link
    };
    function link(scope, element, attrs, modelCtrl) {
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
(function () {
    'use strict';
    // NOT Used!
    //directive handles native bootstrap popover; I've made the switch to ui.bootstrap
    angular.module('challenge').directive('bsPopover', bsPopover);
    function bsPopover() {
        var directive = {
            restrict: 'A',
            scope: {},
            link: link
        };
        function link(scope, element) {
            element
                .find('button[rel="popover"]')
                .popover({ placement: "right", html: "true" })
                .on("click", function (e) {
                e.preventDefault(); // hide all other popovers
                angular.element("[rel=popover]").not(e.target).popover("hide");
                // $(".popover").remove();
            });
        }
        return directive;
    }
})();
(function () {
    'use strict';
    angular.module('challenge').directive('bsField', bsField);
    function bsField() {
        var directive = {
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
            link: function (scope, elem, attr, formCtrl) {
                if (attr.required !== undefined) {
                    scope.ctrl.required = true;
                }
                if (attr.disabled !== undefined) {
                    scope.ctrl.disabled = true;
                }
                scope.ctrl.form = formCtrl;
            },
            transclude: true,
            template: "\n      <div ng-class=\"{\n        'form-group': true,\n        'has-error': ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid,\n        'has-feedback': ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid\n      }\">\n        <label htmlFor=\"{{ctrl.name}}\" class=\"col-sm-2 control-label\"> {{ ctrl.label }} </label>\n        <div class=\"col-sm-9\" ng-switch=\"ctrl.type\">\n          <select ng-switch-when=\"select\" name=\"{{ctrl.name}}\" id=\"{{ctrl.name}}\" ng-model=\"ctrl.value\" ng-disabled=\"ctrl.disabled\" class=\"form-control\" ng-required=\"ctrl.required\" ng-transclude></select>\n\n          <input ng-switch-default type=\"{{ctrl.type || 'text'}}\" name=\"{{ctrl.name}}\" id=\"{{ctrl.name}}\" ng-model=\"ctrl.value\" ng-disabled=\"ctrl.disabled\" class='form-control' ng-required=\"ctrl.required\" />\n\n          <span ng-if=\"ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$invalid\" class=\"glyphicon glyphicon-remove form-control-feedback\"></span>\n          \n          <div ng-if=\"ctrl.form[ctrl.name].$touched && ctrl.form[ctrl.name].$error.required\" class='text-danger bg-warning' style=\"padding: 2; marginBottom: 0;\">\n            &nbsp;\n            <span class=\"glyphicon glyphicon-warning-sign\" aria-hidden=\"true\"></span>\n            Required!\n          </div>\n        </div>\n      </div>"
        };
        return directive;
    }
    angular.module('challenge').filter('replaceUnderscores', function () {
        return function (input) {
            return (!!input) ? input.replace('_', ' ') : '';
        };
    });
})();
