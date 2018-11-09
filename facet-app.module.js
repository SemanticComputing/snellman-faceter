(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */

    // Module definition, note the dependency.
    angular.module('facetApp', [
      'ui.router',
      'seco.facetedSearch'
    ])

    //.constant('google', google)
    .constant('_', _) // eslint-disable-line no-undef

    .value('SPARQL_ENDPOINT_URL', 'https://ldf.fi/snellman/sparql')
    //.value('SPARQL_ENDPOINT_URL', 'http://localhost:3042/ds/sparql')


    .run(function ($rootScope, $state, $stateParams) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
    })

    .run(function(authStorage) {
        authStorage.init();
    })

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    .config(function($urlRouterProvider){
        $urlRouterProvider.when('', '/texts');
    })

    .service('authInterceptor', function ($q, $state) {
        this.responseError = function(response) {
            // console.log(response.status);
            if (response.status == 401) {
                $state.go('login');
            }
            return $q.reject(response);
        };
    })

    .config(function($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    })

    // .config(function($locationProvider) {
    //     $locationProvider.html5Mode(true);
    // })

    .config(function($stateProvider) {
        $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'LoginController',
            controllerAs: 'vm'
        })
        .state('texts', {
            url: '/texts',
            abstract: true,
        })
        .state('texts.demo', {
            url: '?facets',
            //url: '/finds',
            templateUrl: 'views/pahe.html',
            controller: 'PaheFacetController',
            controllerAs: 'vm',
            reloadOnSearch: false,
            redirectTo: 'texts.demo.list'
        })
        .state('texts.demo.list', {
            url: '/list',
            templateUrl: 'views/pahe_list.html',
            controller: 'PaheController',
            controllerAs: 'vm'
        })

    })
})();
